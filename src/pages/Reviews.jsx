import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Star, Eye, EyeOff, MessageSquare, Award } from 'lucide-react';
import { HotelSelector } from '../components/shared/HotelSelector';
import { toast } from 'react-hot-toast';
import {
  fetchHotelReviews,
  fetchHotelReviewSummary,
  updateReviewStatus,
  selectReviews,
  selectReviewSummary,
  selectReviewsLoading,
  clearReviews,
} from '../store/slices/reviewSlice';
import { ReviewsSkeleton } from '../components/common/Skeleton';
import { selectPrimaryHotelId } from '../store/slices/userSlice';

export const Reviews = () => {
  const dispatch = useDispatch();
  const reviews = useSelector(selectReviews) || [];
  const summary = useSelector(selectReviewSummary);
  const loading = useSelector(selectReviewsLoading);

  const activeHotelId = useSelector(selectPrimaryHotelId);
  const [activeFilter, setActiveFilter] = useState('ALL');

  useEffect(() => {
    if (activeHotelId) {
      dispatch(clearReviews());
      dispatch(fetchHotelReviews(activeHotelId));
      dispatch(fetchHotelReviewSummary(activeHotelId));
    }
  }, [dispatch, activeHotelId]);

  const handleToggleStatus = async (reviewId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE';

    try {
      await dispatch(updateReviewStatus({ hotelId: activeHotelId, reviewId, status: newStatus })).unwrap();
      toast.success(`Review ${newStatus === 'ACTIVE' ? 'shown' : 'hidden'} successfully`);
    } catch (error) {
      toast.error(error || 'Failed to update review status');
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      ROOM_QUALITY: 'Room Quality',
      AMENITIES: 'Amenities',
      STAFF_BEHAVIOR: 'Staff Behavior',
      CLEANLINESS: 'Cleanliness',
      VALUE: 'Value',
      LOCATION: 'Location',
    };
    return labels[category] || category;
  };

  const filteredReviews = reviews.filter((review) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'ACTIVE') return review.status === 'ACTIVE';
    if (activeFilter === 'HIDDEN') return review.status === 'HIDDEN';
    return review.overallRating === parseInt(activeFilter);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Guest Reviews</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage and respond to guest feedback</p>
        <div className="mt-2">
          <HotelSelector />
        </div>
      </div>

      {!activeHotelId && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <MessageSquare className="w-14 h-14 text-slate-200 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700 mb-1">No hotel selected</h3>
          <p className="text-sm text-slate-500">Select a property above to view guest reviews.</p>
        </div>
      )}

      {activeHotelId && loading && reviews.length === 0 && <ReviewsSkeleton />}

      {/* Rating Overview */}
      {activeHotelId && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Average Rating Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200 p-8 text-center"
        >
          <div className="text-6xl font-black text-slate-900 mb-2">
            {summary?.overallAverageRating?.toFixed(1) || '0.0'}
          </div>
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= (summary?.overallAverageRating || 0)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-slate-300'
                }`}
              />
            ))}
          </div>
          <p className="text-slate-600 font-semibold">
            {summary?.totalReviews || 0} reviews
          </p>
        </motion.div>

        {/* Category Averages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-slate-200 p-6 col-span-2"
        >
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900">Category Ratings</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary?.categoryAverages?.map((category) => (
              <div key={category.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    {getCategoryLabel(category.category)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {category.averageRating.toFixed(1)}
                    </span>
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </div>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-400"
                    style={{ width: `${(category.averageRating / 5) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500">
                  {category.totalRatings} ratings
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      )}

      {activeHotelId && (
      <>
        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap gap-2">
            {['ALL', 'ACTIVE', 'HIDDEN', '5', '4', '3', '2', '1'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeFilter === filter
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter === 'ALL' ? 'All Reviews' : filter === 'ACTIVE' ? 'Visible' : filter === 'HIDDEN' ? 'Hidden' : `${filter} Stars`}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              {filteredReviews.length} Reviews
            </h2>
          </div>

          {filteredReviews.length === 0 ? (
            <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-12 text-center">
              <MessageSquare className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No reviews yet</h3>
              <p className="text-slate-600">Reviews from guests will appear here</p>
            </div>
          ) : (
            filteredReviews.map((review, index) => (
              <motion.div
                key={review.reviewId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-xl border-2 p-6 ${
                  review.status === 'HIDDEN'
                    ? 'border-red-200 bg-red-50'
                    : 'border-slate-200'
                }`}
              >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= review.overallRating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-bold text-slate-900">
                      {Number(review.overallRating).toFixed(1)}
                    </span>
                  </div>
                  <p className="text-slate-700 text-lg mb-3">{review.overallComment}</p>
                  <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                    <span className="font-medium">
                      📅 {new Date(review.reviewDate).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>Booking ID: {review.bookingId?.substring(0, 8)}...</span>
                  </div>
                </div>

                {/* Status Toggle */}
                <button
                  onClick={() => handleToggleStatus(review.reviewId, review.status)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                    review.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  {review.status === 'ACTIVE' ? (
                    <>
                      <Eye className="w-4 h-4" />
                      Visible
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Hidden
                    </>
                  )}
                </button>
              </div>

              {/* Category Ratings */}
              {review.categoryRatings && review.categoryRatings.length > 0 && (
                <div className="border-t border-slate-200 pt-4">
                  <h4 className="text-sm font-bold text-slate-700 mb-3">
                    Category Breakdown:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {review.categoryRatings.map((cat) => (
                      <div
                        key={cat.category}
                        className="bg-slate-50 rounded-lg p-3 border border-slate-200"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-700">
                            {getCategoryLabel(cat.category)}
                          </span>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-bold">{cat.rating}</span>
                          </div>
                        </div>
                        {cat.comment && (
                          <p className="text-xs text-slate-600 mt-2">"{cat.comment}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
      </>
      )}
    </div>
  );
};
