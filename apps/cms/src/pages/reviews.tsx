import { useState } from "react";
import { Search, Loader2, Star, Check, X, Trash2, Eye } from "lucide-react";
import { useReviews, useApproveReview, useUpdateReview, useDeleteReview, type Review } from "@/features/reviews";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export function ReviewsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved">("all");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);

  const { data: reviewsData, isLoading, error } = useReviews();
  const reviews = Array.isArray(reviewsData) ? reviewsData : [];
  const approveReview = useApproveReview();
  const updateReview = useUpdateReview();
  const deleteReviewMutation = useDeleteReview();

  const handleApprove = async (id: string) => {
    try {
      await approveReview.mutateAsync(id);
      toast.success("Review approved");
      setSelectedReview(null);
    } catch {
      toast.error("Failed to approve review");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateReview.mutateAsync({ id, data: { isActive: false } });
      toast.success("Review rejected");
      setSelectedReview(null);
    } catch {
      toast.error("Failed to reject review");
    }
  };

  const handleDelete = async () => {
    if (!deleteReviewId) return;
    try {
      await deleteReviewMutation.mutateAsync(deleteReviewId);
      toast.success("Review deleted");
      setDeleteReviewId(null);
    } catch {
      toast.error("Failed to delete review");
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter reviews
  const filteredReviews = reviews.filter((review) => {
    // Status filter
    if (statusFilter === "pending" && review.isApproved) return false;
    if (statusFilter === "approved" && !review.isApproved) return false;

    // Search filter
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      review.customerName?.toLowerCase().includes(searchLower) ||
      review.title?.toLowerCase().includes(searchLower) ||
      review.content?.toLowerCase().includes(searchLower) ||
      review.product?.nameEn?.toLowerCase().includes(searchLower)
    );
  });

  const pendingCount = reviews.filter((r) => !r.isApproved && r.isActive).length;

  return (
    <div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
        <p className="mt-1 text-muted-foreground">
          Manage customer reviews. {pendingCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingCount} pending
            </Badge>
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            All
          </Button>
          <Button
            variant={statusFilter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("pending")}
          >
            Pending {pendingCount > 0 && `(${pendingCount})`}
          </Button>
          <Button
            variant={statusFilter === "approved" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("approved")}
          >
            Approved
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 border rounded-lg">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">
            Failed to load reviews
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No reviews found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                        {review.customerName?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{review.customerName || "Anonymous"}</p>
                        {review.userId && (
                          <p className="text-xs text-muted-foreground">Verified</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm truncate max-w-[200px]">
                      {review.product?.nameEn || "Unknown Product"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm truncate max-w-[200px]">{review.title}</p>
                  </TableCell>
                  <TableCell>
                    {!review.isActive ? (
                      <Badge variant="secondary">Rejected</Badge>
                    ) : review.isApproved ? (
                      <Badge variant="default" className="bg-green-600">Approved</Badge>
                    ) : (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground">{formatDate(review.createdAt)}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedReview(review)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!review.isApproved && review.isActive && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => handleApprove(review.id)}
                          disabled={approveReview.isPending}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteReviewId(review.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Review Detail Dialog */}
      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                  {selectedReview.customerName?.charAt(0)?.toUpperCase() || "U"}
                </span>
                <div>
                  <p className="font-medium">{selectedReview.customerName || "Anonymous"}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(selectedReview.createdAt)}
                  </p>
                </div>
                {selectedReview.userId && (
                  <Badge variant="secondary" className="ml-auto">Verified</Badge>
                )}
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Product</p>
                <p className="font-medium">{selectedReview.product?.nameEn || "Unknown"}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Rating</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= selectedReview.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="ml-2 font-medium">{selectedReview.rating}/5</span>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Title</p>
                <p className="font-medium">{selectedReview.title}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Content</p>
                <p className="text-sm">{selectedReview.content}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                {!selectedReview.isActive ? (
                  <Badge variant="secondary">Rejected</Badge>
                ) : selectedReview.isApproved ? (
                  <Badge variant="default" className="bg-green-600">Approved</Badge>
                ) : (
                  <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                    Pending Approval
                  </Badge>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            {selectedReview && !selectedReview.isApproved && selectedReview.isActive && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleReject(selectedReview.id)}
                  disabled={updateReview.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleApprove(selectedReview.id)}
                  disabled={approveReview.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteReviewId} onOpenChange={() => setDeleteReviewId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
