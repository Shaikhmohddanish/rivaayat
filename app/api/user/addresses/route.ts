import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { MongoClient, ObjectId } from "mongodb"
import type { Address } from "@/lib/types"
import { getCurrentDateIST } from "@/lib/date-utils"

const uri = process.env.MONGODB_URI
if (!uri) {
  throw new Error('Please add your MongoDB URI to .env.local')
}

const client = new MongoClient(uri)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    // NOTE: User address data is now cached in localStorage instead of Redis
    // to save Redis memory for admin and shared data

    await client.connect()
    const db = client.db("rivaayat")
    const users = db.collection("users")

    // Get user ID first
    const user = await users.findOne(
      { email: session.user.email },
      { projection: { _id: 1, addressIds: 1 } }
    )
    
    if (!user) {
      return NextResponse.json({
        addresses: []
      })
    }
    
    // If user exists but has no addresses yet
    if (!user.addressIds || user.addressIds.length === 0) {
      return NextResponse.json({
        addresses: []
      })
    }
    
    // Convert address ID strings to ObjectIds
    const addressIds = user.addressIds.map((id: string) => new ObjectId(id))
    
    // Get addresses from the addresses collection
    const addresses = await db.collection("addresses")
      .find({ _id: { $in: addressIds } })
      .toArray()
    
    // Convert ObjectIds to strings in the response
    const formattedAddresses = addresses.map(addr => ({
      ...addr,
      _id: addr._id.toString(),
    }))
    
    return NextResponse.json({
      addresses: formattedAddresses
    })

  } catch (error) {
    console.error("Error fetching addresses:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { addresses } = body

    if (!Array.isArray(addresses)) {
      return NextResponse.json(
        { error: "Addresses must be an array" },
        { status: 400 }
      )
    }

    // Validate each address
    for (const address of addresses) {
      if (!address.name || !address.street || !address.city || !address.state || !address.zip) {
        return NextResponse.json(
          { error: "Each address must include name, street, city, state, and zip" },
          { status: 400 }
        )
      }
    }

    await client.connect()
    const db = client.db("rivaayat")
    const users = db.collection("users")
    const addressesCollection = db.collection("addresses")

    // Get user ID
    const user = await users.findOne(
      { email: session.user.email },
      { projection: { _id: 1, addressIds: 1 } }
    )

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const userId = user._id.toString()
    const existingAddressIds = user.addressIds || []
    const savedAddresses = []
    const addressIds = []

    // Process each address
    for (const address of addresses) {
      // Check if address has an ID (exists)
      if (address._id) {
        // Update existing address
        const addressId = address._id
        delete address._id  // Remove _id for MongoDB update

        // Make sure address belongs to user
        if (!existingAddressIds.includes(addressId)) {
          return NextResponse.json(
            { error: `Address with ID ${addressId} does not belong to user` },
            { status: 403 }
          )
        }

        // Update address
        await addressesCollection.updateOne(
          { _id: new ObjectId(addressId) },
          { 
            $set: {
              ...address,
              updatedAt: getCurrentDateIST()
            } 
          }
        )

        // Get updated address
        const updatedAddress = await addressesCollection.findOne({ _id: new ObjectId(addressId) })
        savedAddresses.push({
          ...updatedAddress,
          _id: addressId  // Add back the ID for response
        })
        addressIds.push(addressId)
      } else {
        // Create new address
        const newAddress = {
          ...address,
          userId,
          createdAt: getCurrentDateIST(),
          updatedAt: getCurrentDateIST(),
          isDefault: false  // New addresses are not default unless it's the only one
        }
        
        const result = await addressesCollection.insertOne(newAddress)
        const addressId = result.insertedId.toString()
        savedAddresses.push({ ...newAddress, _id: addressId })
        addressIds.push(addressId)
      }
    }

    // If there's only one address, make it default
    if (addressIds.length === 1) {
      await addressesCollection.updateOne(
        { _id: new ObjectId(addressIds[0]) },
        { $set: { isDefault: true, updatedAt: getCurrentDateIST() } }
      )
    }

    // Update user's addressIds
    await users.updateOne(
      { email: session.user.email },
      { $set: { addressIds } }
    )

    // Get updated addresses list
    const updatedAddressList = await addressesCollection
      .find({ userId })
      .toArray()
      
    // Format addresses for response
    const formattedAddresses = updatedAddressList.map(addr => ({
      ...addr,
      _id: addr._id.toString()
    }));
      
    return NextResponse.json({
      success: true,
      addresses: formattedAddresses
    })

  } catch (error) {
    console.error("Error updating addresses:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get the addressId from the URL
    const url = new URL(request.url)
    const addressId = url.searchParams.get('id')

    if (!addressId) {
      return NextResponse.json(
        { error: "Address ID is required" },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db("rivaayat")
    const users = db.collection("users")
    const addressesCollection = db.collection("addresses")

    // Get user first
    const user = await users.findOne(
      { email: session.user.email },
      { projection: { _id: 1 } }
    )
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }
    
    const userId = user._id.toString()
    
    // Get the address to delete
    const addressObjectId = new ObjectId(addressId)
    const addressToDelete = await addressesCollection.findOne({ 
      _id: addressObjectId,
      userId 
    })
    
    if (!addressToDelete) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      )
    }
    
    // Delete the address
    await addressesCollection.deleteOne({ _id: addressObjectId })
    
    // Get current addressIds
    const currentUser = await users.findOne(
      { email: session.user.email },
      { projection: { addressIds: 1 } }
    )
    
    const addressIds = (currentUser?.addressIds || []).filter((id: string) => id !== addressId)
    
    // Update user document to remove reference to address
    await users.updateOne(
      { email: session.user.email },
      { 
        $set: { 
          addressIds: addressIds,
          updatedAt: getCurrentDateIST() 
        }
      }
    )
    
    // If deleted address was default, make first remaining address default
    if (addressToDelete.isDefault) {
      const remainingAddresses = await addressesCollection
        .find({ userId })
        .sort({ createdAt: 1 })
        .toArray()
        
      if (remainingAddresses.length > 0) {
        await addressesCollection.updateOne(
          { _id: remainingAddresses[0]._id },
          { $set: { isDefault: true, updatedAt: getCurrentDateIST() } }
        )
      }
    }
    
    // Get updated addresses list
    const updatedAddressList = await addressesCollection
      .find({ userId })
      .toArray()
      
    // Format addresses for response  
    const formattedAddresses = updatedAddressList.map(addr => ({
      ...addr,
      _id: addr._id.toString()
    }));
      
    return NextResponse.json({
      success: true,
      addresses: formattedAddresses
    })

  } catch (error) {
    console.error("Error deleting address:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}