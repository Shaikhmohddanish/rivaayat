"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { UserDetails } from "@/components/ui/user-details"
import { Pencil, Search, Info, User as UserIcon, Ban } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import type { User } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({ 
    name: "", 
    role: "user" as "user" | "admin", 
    disabled: false 
  })
  const [saving, setSaving] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/")
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.role === "admin") {
      fetchUsers()
    }
  }, [session])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredUsers(
        users.filter(
          (user) =>
            user.name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            user.role.toLowerCase().includes(query),
        ),
      )
    }
  }, [searchQuery, users])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
        setFilteredUsers(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setEditForm({
      name: user.name,
      role: user.role,
      disabled: user.disabled || false,
    })
  }

  const handleSave = async () => {
    if (!editingUser?._id) return

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/users/${editingUser._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setUsers(users.map((u) => (u._id === updatedUser._id ? updatedUser : u)))
        setEditingUser(null)
        toast({
          title: "Success",
          description: "User updated successfully",
          variant: "default"
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update user",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  // We now use the loading.tsx file for the loading state
  if (status === "loading") {
    return null
  }

  if (session?.user?.role !== "admin") {
    return null
  }

  return (
    <div className="container mx-auto py-4 sm:py-8 px-4">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">User Management</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Manage user accounts and roles</p>
      </div>

      <div className="mb-4 sm:mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            aria-label="Search users"
          />
        </div>
      </div>

      <div className="bg-card rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full" role="table" aria-label="Users list">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm">User</th>
                <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm hidden md:table-cell">Email</th>
                <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm">Role</th>
                <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm hidden lg:table-cell">Provider</th>
                <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm">Status</th>
                <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm hidden sm:table-cell">Joined</th>
                <th className="text-right p-2 sm:p-4 font-medium text-xs sm:text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id} className={`border-b last:border-0 hover:bg-muted/50 ${user.disabled ? "bg-muted/30" : ""}`}>
                  <td className="p-2 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                        <AvatarImage src={user.image || "/placeholder.svg"} alt={`${user.name}'s profile picture`} />
                        <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <span className="font-medium text-sm sm:text-base block truncate">{user.name}</span>
                        <span className="text-xs text-muted-foreground md:hidden block truncate">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-2 sm:p-4 text-muted-foreground text-sm hidden md:table-cell">{user.email}</td>
                  <td className="p-2 sm:p-4">
                    <Badge variant={user.role === "admin" ? "default" : "secondary"} className="capitalize text-xs">
                      {user.role}
                    </Badge>
                  </td>
                  <td className="p-2 sm:p-4 text-muted-foreground capitalize text-sm hidden lg:table-cell">{user.provider || "credentials"}</td>
                  <td className="p-2 sm:p-4">
                    {user.disabled ? (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <Ban className="h-3 w-3" />
                        Disabled
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <UserIcon className="h-3 w-3" />
                        Active
                      </Badge>
                    )}
                  </td>
                  <td className="p-2 sm:p-4 text-muted-foreground text-sm hidden sm:table-cell">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="p-2 sm:p-4 text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => user._id && setSelectedUserId(user._id)} 
                        title="View user details and order history"
                        aria-label={`View details for ${user.name}`}
                        className="touch-target"
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEdit(user)} 
                        title="Edit user information"
                        aria-label={`Edit ${user.name}`}
                        className="touch-target"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No users found</p>
          </div>
        )}
      </div>

      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit User</DialogTitle>
            <DialogDescription className="text-sm">Update user information and role</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(value: "user" | "admin") => setEditForm({ ...editForm, role: value })}
              >
                <SelectTrigger id="role" aria-label="User role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-sm text-muted-foreground italic">
              Note: Users manage their profile pictures from their profile page.
            </p>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="disabled" 
                checked={editForm.disabled}
                onCheckedChange={(checked) => 
                  setEditForm({ ...editForm, disabled: checked === true })}
              />
              <Label htmlFor="disabled" className="text-sm font-medium leading-none">
                Disable this account
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* User Details Modal */}
      {selectedUserId && (
        <UserDetails 
          userId={selectedUserId} 
          isOpen={!!selectedUserId} 
          onClose={() => setSelectedUserId(null)} 
        />
      )}
    </div>
  )
}
