# Shimmer UI Implementation Plan
**Project**: Rivaayat E-commerce  
**Objective**: Replace all loading text, loaders, and spinners with consistent shimmer UI throughout the website  
**Date**: November 27, 2025

---

## 📊 Current State Analysis

### ✅ Already Using Shimmer UI (Good Examples)
These files are already properly implementing shimmer UI:

1. **`app/orders/loading.tsx`** ✅
   - Uses custom shimmer classes (`shimmer`, `shimmer-card`)
   - Proper card-based layout with shimmer effects
   - Good responsive design

2. **`app/cart/loading.tsx`** ✅
   - Uses `ShimmerHeading`, `ShimmerText`, `ShimmerButton` components
   - Clean implementation with proper spacing
   - Uses `shimmer-card` for images

3. **`app/search/loading.tsx`** ✅
   - Uses raw shimmer classes effectively
   - Good layout structure matching the actual page

4. **`app/shop/loading.tsx`** ✅
   - Uses imported shimmer components
   - `ShimmerProductCard` for product grid
   - Well-structured with filters and product grid

5. **`components/ui/shimmer.tsx`** ✅
   - Comprehensive shimmer component library exists
   - Provides reusable components: `Shimmer`, `ShimmerText`, `ShimmerTitle`, `ShimmerHeading`, `ShimmerCard`, `ShimmerButton`, `ShimmerAvatar`, `ShimmerImage`, `ShimmerProductCard`
   - Flexible with props for customization

---

## ❌ Issues Found - Loading States to Replace

### 🔴 **CRITICAL: Text-Based Loading States**

#### 1. **`app/wishlist/page.tsx`** (Line 99)
```tsx
if (loading) {
  return (
    <div className="container mx-auto px-4 py-8">
      <p className="text-center">Loading...</p>  // ❌ REPLACE
    </div>
  )
}
```
**Fix**: Create `app/wishlist/loading.tsx` with shimmer product cards

---

#### 2. **`app/profile/page.tsx`** (Line 127)
```tsx
if (status === "loading" || loading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Loading profile...</p>  // ❌ REPLACE
    </div>
  )
}
```
**Fix**: Create `app/profile/loading.tsx` with profile shimmer layout

---

#### 3. **`app/orders/page.tsx`** (Line 102-110)
```tsx
if (status === "loading" || loading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Loading orders...</p>  // ❌ REPLACE
    </div>
  )
}
```
**Note**: `app/orders/loading.tsx` exists but page has inline loading text - ensure Next.js loading.tsx is used

---

#### 4. **`app/orders/[id]/page.tsx`** (Line 167-175)
```tsx
if (status === "loading" || loading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Loading order...</p>  // ❌ REPLACE
    </div>
  )
}
```
**Fix**: Create `app/orders/[id]/loading.tsx` with order details shimmer

---

#### 5. **`app/order-success/page.tsx`** (Line 56)
```tsx
<Suspense fallback={
  <div className="container mx-auto px-4 py-16">
    <p className="text-center">Loading...</p>  // ❌ REPLACE
  </div>
}>
```
**Note**: `app/order-success/loading.tsx` exists - ensure it's used properly

---

### 🟡 **MEDIUM: Button Loading States**

#### 6. **`app/checkout/page.tsx`** (Line 548-549)
```tsx
<Button type="submit" className="w-full" size="lg" disabled={loading}>
  {loading ? "Processing..." : "Place Order"}  // ❌ TEXT CHANGE
</Button>
```
**Fix**: Add spinner icon instead of just text
```tsx
<Button type="submit" disabled={loading}>
  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {loading ? "Processing..." : "Place Order"}
</Button>
```

---

#### 7. **`app/order-tracking/page.tsx`** (Line 128-129)
```tsx
<Button type="submit" className="w-full" disabled={loading}>
  {loading ? "Tracking..." : "Track Order"}  // ❌ TEXT CHANGE
</Button>
```
**Fix**: Add spinner icon
```tsx
<Button type="submit" disabled={loading}>
  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {loading ? "Tracking..." : "Track Order"}
</Button>
```

---

### 🟠 **LOW: Spinner Usage (Consider Shimmer Alternative)**

#### 8. **`app/search/page.tsx`** (Line 217-219)
```tsx
{loading && (
  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
)}
```
**Assessment**: This is acceptable - inline search spinners are common UX pattern. Keep as-is.

---

#### 9. **`components/image-upload.tsx`** (Line 130)
```tsx
{uploading ? (
  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
) : (
  <Upload className="h-8 w-8 text-muted-foreground" />
)}
```
**Assessment**: Acceptable for file upload. Keep spinner for upload progress.

---

#### 10. **`components/product-image-upload.tsx`** (Line 152)
```tsx
{uploading ? (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
) : ...}
```
**Assessment**: Keep for upload progress indication.

---

### 🟢 **ADMIN DASHBOARD CONSIDERATIONS**

#### 11. **`app/admin/page.tsx`** (Line 108-115)
```tsx
{loading ? (
  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="bg-card rounded-lg border p-3 sm:p-6 animate-pulse">
        <div className="h-8 sm:h-12 w-8 sm:w-12 bg-muted rounded-lg mb-2 sm:mb-4" />
        <div className="h-3 sm:h-4 bg-muted rounded w-16 sm:w-24 mb-1 sm:mb-2" />
        <div className="h-6 sm:h-8 bg-muted rounded w-12 sm:w-16" />
      </div>
    ))}
  </div>
) : ...}
```
**Fix**: Replace `animate-pulse` with `shimmer` class for consistency

---

#### 12. **`app/admin/loading.tsx`** (Line 11-15)
```tsx
<div key={i} className="bg-card rounded-lg border p-3 sm:p-6 animate-pulse">
  <div className="h-8 sm:h-12 w-8 sm:w-12 bg-muted rounded-lg mb-2 sm:mb-4" />
  <div className="h-3 sm:h-4 bg-muted rounded w-16 sm:w-24 mb-1 sm:mb-2" />
  <div className="h-6 sm:h-8 bg-muted rounded w-12 sm:w-16" />
</div>
```
**Fix**: Replace `animate-pulse` and `bg-muted` with `shimmer` class

---

## 🎯 Implementation Strategy

### Phase 1: Enhance Shimmer Component Library (Priority: HIGH)
**File**: `components/ui/shimmer.tsx`

Add missing shimmer components:
```tsx
// Profile Page Shimmer
export function ShimmerProfileCard() {
  return (
    <div className="bg-card/50 rounded-2xl p-6 elegant-shadow border-0 space-y-4">
      <div className="flex items-center gap-4">
        <ShimmerAvatar size={80} />
        <div className="space-y-2 flex-1">
          <ShimmerHeading className="w-48" />
          <ShimmerText className="w-32" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
        <div className="space-y-2">
          <ShimmerText className="w-20" />
          <ShimmerTitle className="w-24" />
        </div>
        <div className="space-y-2">
          <ShimmerText className="w-20" />
          <ShimmerTitle className="w-24" />
        </div>
      </div>
    </div>
  )
}

// Order Card Shimmer
export function ShimmerOrderCard() {
  return (
    <div className="bg-card/50 rounded-2xl overflow-hidden elegant-shadow border-0">
      <div className="bg-gradient-to-r from-muted/20 to-muted/40 p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <ShimmerTitle className="w-36" />
            <ShimmerText className="w-52" />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-7 rounded-full shimmer w-24" />
            <ShimmerButton />
          </div>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <ShimmerText className="w-full" />
        <ShimmerText className="w-3/4" />
        <ShimmerText className="w-1/2" />
      </div>
    </div>
  )
}

// Address Card Shimmer
export function ShimmerAddressCard() {
  return (
    <div className="bg-card/50 rounded-xl p-4 elegant-shadow border-0 space-y-3">
      <div className="flex justify-between items-start">
        <ShimmerTitle className="w-32" />
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded shimmer" />
          <div className="w-8 h-8 rounded shimmer" />
        </div>
      </div>
      <ShimmerText className="w-full" />
      <ShimmerText className="w-4/5" />
      <ShimmerText className="w-3/5" />
    </div>
  )
}

// Order Details Shimmer
export function ShimmerOrderDetails() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-card/50 rounded-2xl p-6 elegant-shadow border-0">
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-2">
            <ShimmerHeading className="w-48" />
            <ShimmerText className="w-32" />
          </div>
          <div className="h-8 rounded-full shimmer w-28" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 pb-4 border-b">
              <div className="w-20 h-20 rounded-lg shimmer-card" />
              <div className="flex-1 space-y-2">
                <ShimmerTitle className="w-48" />
                <ShimmerText className="w-32" />
                <ShimmerText className="w-24" />
              </div>
              <ShimmerTitle className="w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

---

### Phase 2: Create Missing Loading Files (Priority: HIGH)

#### 2.1 Create `app/wishlist/loading.tsx`
```tsx
import { ShimmerHeading, ShimmerText, ShimmerProductCard } from "@/components/ui/shimmer"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <ShimmerHeading className="w-64 h-12 mx-auto" />
          <ShimmerText className="w-96 h-6 mx-auto" />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <ShimmerProductCard key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
```

#### 2.2 Create `app/profile/loading.tsx`
```tsx
import { ShimmerProfileCard, ShimmerAddressCard } from "@/components/ui/shimmer"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <ShimmerProfileCard />
        
        <div className="space-y-4">
          <div className="h-8 rounded-lg shimmer w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <ShimmerAddressCard key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

#### 2.3 Create `app/orders/[id]/loading.tsx`
```tsx
import { ShimmerOrderDetails } from "@/components/ui/shimmer"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <ShimmerOrderDetails />
      </div>
    </div>
  )
}
```

---

### Phase 3: Update Existing Files (Priority: MEDIUM)

#### 3.1 Remove inline loading states from pages
**Files to update**:
- `app/wishlist/page.tsx` - Remove line 96-100
- `app/profile/page.tsx` - Remove line 127-132
- `app/orders/page.tsx` - Verify Next.js loading.tsx is used
- `app/orders/[id]/page.tsx` - Remove line 167-175

**Strategy**: Next.js will automatically use the `loading.tsx` files we create. Remove inline loading returns.

---

#### 3.2 Update Admin Dashboard shimmer
**Files**: 
- `app/admin/page.tsx` (line 108-115)
- `app/admin/loading.tsx` (line 11-15)

**Changes**:
Replace `animate-pulse` with `shimmer` class:
```tsx
// Before
<div className="bg-card rounded-lg border p-3 sm:p-6 animate-pulse">
  <div className="h-8 bg-muted rounded-lg mb-2" />
  <div className="h-4 bg-muted rounded w-24 mb-2" />
  <div className="h-8 bg-muted rounded w-16" />
</div>

// After
<div className="bg-card rounded-lg border p-3 sm:p-6">
  <div className="h-8 shimmer rounded-lg mb-2" />
  <div className="h-4 shimmer rounded w-24 mb-2" />
  <div className="h-8 shimmer rounded w-16" />
</div>
```

---

#### 3.3 Update Button Loading States
**Files**:
- `app/checkout/page.tsx` (line 548-549)
- `app/order-tracking/page.tsx` (line 128-129)

Add Loader2 icon import and update buttons:
```tsx
import { Loader2 } from "lucide-react"

<Button type="submit" disabled={loading}>
  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {loading ? "Processing..." : "Place Order"}
</Button>
```

---

### Phase 4: Verify Other Admin Loading Files (Priority: LOW)

Check these files use shimmer properly:
- ✅ `app/admin/products/loading.tsx`
- ✅ `app/admin/coupons/loading.tsx`
- ✅ `app/admin/products/[id]/loading.tsx`
- ✅ `app/admin/orders/loading.tsx`
- ✅ `app/admin/users/loading.tsx`
- ✅ `app/admin/tracking/loading.tsx`
- ✅ `app/product/[id]/loading.tsx`

**Action**: Read and verify each file uses `shimmer` class instead of `animate-pulse` or `bg-muted`

---

## 📋 Summary of Changes Required

### Files to CREATE:
1. ✅ Expand `components/ui/shimmer.tsx` with new shimmer components
2. ❌ Create `app/wishlist/loading.tsx`
3. ❌ Create `app/profile/loading.tsx`
4. ❌ Create `app/orders/[id]/loading.tsx`

### Files to UPDATE:
5. ❌ Update `app/wishlist/page.tsx` - Remove inline loading text
6. ❌ Update `app/profile/page.tsx` - Remove inline loading text
7. ❌ Update `app/orders/page.tsx` - Verify loading.tsx usage
8. ❌ Update `app/orders/[id]/page.tsx` - Remove inline loading text
9. ❌ Update `app/order-success/page.tsx` - Update Suspense fallback
10. ❌ Update `app/checkout/page.tsx` - Add spinner to button
11. ❌ Update `app/order-tracking/page.tsx` - Add spinner to button
12. ❌ Update `app/admin/page.tsx` - Replace animate-pulse with shimmer
13. ❌ Update `app/admin/loading.tsx` - Replace animate-pulse with shimmer

### Files to VERIFY:
14. ✅ `app/admin/products/loading.tsx`
15. ✅ `app/admin/coupons/loading.tsx`
16. ✅ `app/admin/products/[id]/loading.tsx`
17. ✅ `app/admin/orders/loading.tsx`
18. ✅ `app/admin/users/loading.tsx`
19. ✅ `app/admin/tracking/loading.tsx`
20. ✅ `app/product/[id]/loading.tsx`

---

## 🎨 Design Principles

1. **Consistency**: All loading states use shimmer from `components/ui/shimmer.tsx`
2. **Match Layout**: Shimmer should match the actual page layout
3. **No Text**: Never show "Loading..." text - always use visual shimmer
4. **Smooth Transitions**: Shimmer provides better perceived performance
5. **Accessibility**: Shimmer is better for screen readers than loading text
6. **Mobile First**: Ensure shimmer looks good on all screen sizes

---

## ✅ Testing Checklist

After implementation, test:
- [ ] Home page loads with shimmer
- [ ] Shop page shows product grid shimmer
- [ ] Search page shows shimmer while searching
- [ ] Cart page shows shimmer on load
- [ ] Wishlist page shows product shimmer
- [ ] Profile page shows profile + address shimmer
- [ ] Orders page shows order list shimmer
- [ ] Individual order page shows order details shimmer
- [ ] Checkout button shows spinner when processing
- [ ] Order tracking button shows spinner when tracking
- [ ] Admin dashboard shows stat card shimmer
- [ ] All admin pages use consistent shimmer
- [ ] No "Loading..." text appears anywhere
- [ ] No `animate-pulse` used (use `shimmer` instead)

---

## 📈 Expected Improvements

1. **Visual Consistency**: All loading states look professional and consistent
2. **Better UX**: Users see content structure before data loads (skeleton screen pattern)
3. **Reduced Perceived Wait Time**: Shimmer animation makes wait feel shorter
4. **Professional Appearance**: Modern web standard for loading states
5. **Accessibility**: Better than loading text for screen readers
6. **Maintainability**: Centralized shimmer components easy to update

---

## 🚀 Next Steps

1. Review and approve this plan
2. Implement Phase 1 (Shimmer components)
3. Implement Phase 2 (Create loading files)
4. Implement Phase 3 (Update existing files)
5. Implement Phase 4 (Verify admin files)
6. Test thoroughly across all pages
7. Deploy and monitor

---

**End of Plan**
