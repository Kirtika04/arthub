import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductById } from '../services/productService';
import { getProductReviews, addProductReview } from '../services/reviewService';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { resolveImageUrl } from '../services/imageUrl';

const ProductDetails = () => {
    const { id } = useParams();
    const { addToCart } = useContext(CartContext);
    const { user } = useContext(AuthContext);

    const [product, setProduct] = useState(null);
    const [reviewsData, setReviewsData] = useState({ reviews: [], avgRating: 0, totalReviews: 0 });
    const [loading, setLoading] = useState(true);
    
    // New review form state
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [reviewError, setReviewError] = useState('');

    const fetchAllData = async () => {
        try {
            const prodRes = await getProductById(id);
            setProduct(prodRes.data.product);

            const revRes = await getProductReviews(id);
            setReviewsData(revRes.data);
        } catch (error) {
            console.error("Failed to fetch product details", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [id]);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setReviewError('');

        try {
            await addProductReview(id, { rating: Number(rating), comment });
            setComment('');
            fetchAllData(); // Refresh reviews and ratings
        } catch (err) {
            setReviewError(err.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="text-center mt-5"><div className="spinner-border"></div></div>;
    if (!product) return <div className="container mt-5"><h4>Product not found.</h4></div>;

    const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];

    return (
        <div className="container mt-5 mb-5">
            <Link to="/" className="btn btn-outline-secondary mb-4">&larr; Back to Shop</Link>
            
            <div className="row g-5">
                <div className="col-md-6">
                    <img 
                        src={resolveImageUrl(primaryImage?.image_url, 'https://via.placeholder.com/400')} 
                        alt={product.title} 
                        className="img-fluid rounded shadow-sm w-100" 
                        style={{ maxHeight: '450px', objectFit: 'cover' }}
                    />
                </div>
                <div className="col-md-6">
                    <span className="badge bg-secondary mb-2">{product.category_name}</span>
                    <h2 className="fw-bold">{product.title}</h2>
                    <h4 className="text-success mb-3">₹{parseFloat(product.base_price).toFixed(2)}</h4>
                    
                    <div className="mb-3">
                        <span className="text-warning fs-5">★ {reviewsData.avgRating}</span>
                        <span className="text-muted ms-2">({reviewsData.totalReviews} reviews)</span>
                    </div>

                    <p className="text-muted mb-4">{product.description || 'No description provided for this artwork.'}</p>
                    
                    <button className="btn btn-dark btn-lg px-4" onClick={() => addToCart(product)}>
                        Add to Cart
                    </button>
                </div>
            </div>

            {/* Reviews Section */}
            <div className="row mt-5">
                <div className="col-md-8">
                    <h4 className="mb-4">Customer Reviews</h4>

                    {reviewsData.reviews.length === 0 ? (
                        <p className="text-muted">No reviews yet. Be the first to review this product!</p>
                    ) : (
                        reviewsData.reviews.map((rev, index) => (
                            <div key={index} className="card shadow-sm mb-3 p-3">
                                <div className="d-flex justify-content-between">
                                    <h6 className="fw-bold mb-1">{rev.user_name}</h6>
                                    <span className="text-warning">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</span>
                                </div>
                                <p className="text-muted small mb-1">{new Date(rev.created_at).toLocaleDateString()}</p>
                                <p className="mb-0">{rev.comment}</p>
                            </div>
                        ))
                    )}

                    {/* Write Review Form */}
                    {user ? (
                        <div className="card shadow-sm mt-4 p-4 bg-light">
                            <h5 className="mb-3">Leave a Review</h5>
                            {reviewError && <div className="alert alert-danger">{reviewError}</div>}
                            <form onSubmit={handleReviewSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">Rating</label>
                                    <select className="form-select w-auto" value={rating} onChange={(e) => setRating(e.target.value)}>
                                        <option value="5">5 - Excellent</option>
                                        <option value="4">4 - Good</option>
                                        <option value="3">3 - Average</option>
                                        <option value="2">2 - Poor</option>
                                        <option value="1">1 - Terrible</option>
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Comment</label>
                                    <textarea className="form-control" rows="3" value={comment} onChange={(e) => setComment(e.target.value)} required></textarea>
                                </div>
                                <button type="submit" className="btn btn-dark" disabled={submitting}>
                                    {submitting ? 'Submitting...' : 'Post Review'}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="alert alert-secondary mt-4">
                            Please <Link to="/login">Login</Link> to leave a review.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
