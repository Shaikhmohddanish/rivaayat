import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Database, Zap, Filter } from "lucide-react"

export default function SearchTestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Advanced Search Engine</h1>
          <p className="text-lg text-muted-foreground">
            Our intelligent search system uses Redis caching and MongoDB fallback for optimal performance
          </p>
        </div>

        {/* Search Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader className="text-center">
              <Zap className="h-8 w-8 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">Redis Cache First</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Lightning fast search results from Redis cache
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Database className="h-8 w-8 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">MongoDB Fallback</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Comprehensive search in MongoDB when cache misses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Search className="h-8 w-8 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">Smart Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Autocomplete and search suggestions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Filter className="h-8 w-8 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">Advanced Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Filter by category, price, rating and more
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search Flow */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>How Our Search Engine Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold">Redis Cache Search</h3>
                  <p className="text-sm text-muted-foreground">
                    First, we search through all cached products in Redis for instant results
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold">MongoDB Fallback</h3>
                  <p className="text-sm text-muted-foreground">
                    If no results in cache, we search the complete MongoDB database
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold">Intelligent Caching</h3>
                  <p className="text-sm text-muted-foreground">
                    Search results are cached for future queries and faster response times
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Actions */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Test the Search Engine</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/search?q=dress">
                Search "dress"
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/search?q=indian ethnic wear">
                Search "indian ethnic wear"
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/search?q=kurti&minPrice=500&maxPrice=2000">
                Search "kurti" (₹500-₹2000)
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/search">
                Open Search Page
              </Link>
            </Button>
          </div>
        </div>

        {/* API Endpoints */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Available API Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted rounded">
                <code className="text-sm">GET /api/search</code>
                <span className="text-sm text-muted-foreground">Main search endpoint</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded">
                <code className="text-sm">GET /api/search/autocomplete</code>
                <span className="text-sm text-muted-foreground">Autocomplete suggestions</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded">
                <code className="text-sm">POST /api/admin/cache/init</code>
                <span className="text-sm text-muted-foreground">Initialize product cache</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}