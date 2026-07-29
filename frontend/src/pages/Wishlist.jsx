import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { getWishlist, removeFromWishlist } from '../services/wishlistService';
import { CartContext } from '../context/CartContext';
import { resolveImageUrl } from '../services/imageUrl';

const Wishlist = () => {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useContext(CartContext);

    const fetchWishlist = async () => {
        try {
            const res = await getWishlist();
            setWishlistItems(res.data.wishlist || []);
        } catch (error) {
            console.error("Failed to fetch wishlist", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWishlist();
    }, []);

    const handleRemove = async (productId) => {
        try {
            await removeFromWishlist(productId);
            setWishlistItems(wishlistItems.filter(item => item.id !== productId));
        } catch (error) {
            alert('Failed to remove item from wishlist');
        }
    };

    const handleMoveToCart = async (item) => {
        addToCart({
            id: item.id,
            title: item.title,
            base_price: item.base_price,
            images: [{ image_url: item.image_url, is_primary: 1 }]
        });
        await handleRemove(item.id);
    };

    if (loading) return <div className="text-center mt-5"><div className="spinner-border"></div></div>;

    return (
        <div className="container mt-5 mb-5">
            <h2 className="mb-4">My Wishlist</h2>
            {wishlistItems.length === 0 ? (
                <div className="card shadow-sm p-5 text-center">
                    <p className="mb-3 text-muted">Your wishlist is empty.</p>
                    <Link to="/" className="btn btn-dark w-auto mx-auto">Explore Artworks</Link>
                </div>
            ) : (
                <div className="row g-4">
                    {wishlistItems.map(item => (
                        <div key={item.wishlist_id} className="col-md-4">
                            <div className="card shadow-sm h-100">
                                <img 
                                    src={resolveImageUrl(item.image_url, 'https://via.placeholder.com/300')} 
                                    alt={item.title} 
                                    className="card-img-top"
                                    style={{ height: '220px', objectFit: 'cover' }}
                                />
                                <div className="card-body d-flex flex-column">
                                    <span className="badge bg-secondary mb-2 w-auto">{item.category_name}</span>
                                    <h5 className="card-title fw-bold">{item.title}</h5>
                                    <p className="text-success fw-bold">₹{parseFloat(item.base_price).toFixed(2)}</p>
                                    
                                    <div className="mt-auto d-flex gap-2">
                                        <button className="btn btn-dark flex-grow-1" onClick={() => handleMoveToCart(item)}>
                                            Move to Cart
                                        </button>
                                        <button className="btn btn-outline-danger" onClick={() => handleRemove(item.id)}>
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Wishlist;
