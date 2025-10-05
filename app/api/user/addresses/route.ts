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
      if (!address.type || !address.firstName || !address.lastName || 
          !address.addressLine1 || !address.city || !address.state || 
          !address.postalCode || !address.country) {
        return NextResponse.json(
          { error: "Missing required address fields" },
          { status: 400 }
        )
      }

      if (!["home", "work", "billing", "shipping"].includes(address.type)) {
        return NextResponse.json(
          { error: "Invalid address type" },
          { status: 400 }
        )
      }
    }

    // Ensure only one default address
    const defaultAddresses = addresses.filter(addr => addr.isDefault)
    if (defaultAddresses.length > 1) {
      return NextResponse.json(
        { error: "Only one address can be set as default" },
        { status: 400 }
      )
    }

    // If no default address and addresses exist, set first as default
    if (addresses.length > 0 && defaultAddresses.length === 0) {
      addresses[0].isDefault = true
    }

    await client.connect()
    const db = client.db("rivaayat")
    const users = db.collection("users")
    const addressesCollection = db.collection("addresses")
    
    // Get the user ID
    const user = await users.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    const userId = user._id.toString()
    
    // Get existing address IDs for this user
    const existingAddresses = await addressesCollection
      .find({ userId })
      .toArray()
    
    const existingAddressIds = existingAddresses.map(addr => addr._id.toString())
    
    // Process addresses - prepare for batch operations
    const updatedAddresses = []
    const addressIdsToKeep = []
    
    for (const address of addresses) {
      const isExistingAddress = address._id && existingAddressIds.includes(address._id)
      
      const processedAddress = {
        ...address,
        userId,
        country: "India", // Ensure country is always India
        updatedAt: getCurrentDateIST()
      }
      
      if (isExistingAddress) {
        // Update existing address
        const addressId = new ObjectId(address._id)
        await addressesCollection.updateOne(
          { _id: addressId },
          { $set: processedAddress }
        )
        addressIdsToKeep.push(addressId)
      } else {
        // Create new address
        const result = await addressesCollection.insertOne({
          ...processedAddress,
          _id: new ObjectId(),
          createdAt: getCurrentDateIST()
        })
        addressIdsToKeep.push(result.insertedId)
      }
      
      updatedAddresses.push(processedAddress)
    }
    
    // Delete addresses that are no longer in the array
    await addressesCollection.deleteMany({
      userId,
      _id: { $nin: addressIdsToKeep }
    })
    
    // Update user document to reference address IDs only
    const result = await users.updateOne(
      { email: session.user.email },
      { 
        $set: { 
          addressIds: addressIdsToKeep.map(id => id.toString()),
          updatedAt: getCurrentDateIST()
        } 
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Fetch the updated addresses to return
    const updatedAddressList = await addressesCollection
      .find({ userId })
      .toArray();
    
    return NextResponse.json({
      success: true,
      addresses: updatedAddressList.map(addr => ({
        ...addr,
        _id: addr._id.toString()
      }))
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { address } = body

    // Validate required fields
    if (!address.type || !address.firstName || !address.lastName || 
        !address.addressLine1 || !address.city || !address.state || 
        !address.postalCode) {
      return NextResponse.json(
        { error: "Missing required address fields" },
        { status: 400 }
      )
    }

    if (!["home", "work", "billing", "shipping"].includes(address.type)) {
      return NextResponse.json(
        { error: "Invalid address type" },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db("rivaayat")
    const users = db.collection("users")
    const addressesCollection = db.collection("addresses")

    // Get user ID
    const user = await users.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    const userId = user._id.toString()
    
    // Get current addresses for this user to check if this is the first address
    const currentAddresses = await addressesCollection
      .find({ userId })
      .toArray()
    
    // If this is the first address or marked as default, update existing defaults
    if (currentAddresses.length === 0 || address.isDefault) {
      // If there are existing addresses and this is being set as default,
      // remove default flag from others
      if (currentAddresses.length > 0 && address.isDefault) {
        await addressesCollection.updateMany(
          { userId, isDefault: true },
          { $set: { isDefault: false, updatedAt: getCurrentDateIST() } }
        )
      }
      address.isDefault = true
    }
    
    // Create new address
    const newAddressId = new ObjectId()
    
    const newAddress = {
      ...address,
      _id: newAddressId,
      userId,
      country: "India", // Ensure country is always India
      createdAt: getCurrentDateIST(),
      updatedAt: getCurrentDateIST()
    }
    
    await addressesCollection.insertOne(newAddress)
    
    // Update user document with reference to new address
    const updateResult = await users.updateOne(
      { email: session.user.email },
      { 
        $addToSet: { addressIds: newAddressId.toString() },
        $set: { updatedAt: getCurrentDateIST() }
      }
    )

    if (updateResult.matchedCount === 0) {
      // Rollback address creation
      await addressesCollection.deleteOne({ _id: newAddressId })
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Return the created address with string ID
    return NextResponse.json({
      success: true,
      address: {
        ...newAddress,
        _id: newAddressId.toString()
      }
    })

  } catch (error) {
    console.error("Error adding address:", error)
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

    const { searchParams } = new URL(request.url)
    const addressId = searchParams.get("id")

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

    // Get user ID
    const user = await users.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
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
      
    return NextResponse.json({
      success: true,
      addresses: updatedAddressList.map(addr => ({
        ...addr,
        _id: addr._id.toString()
      }))
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