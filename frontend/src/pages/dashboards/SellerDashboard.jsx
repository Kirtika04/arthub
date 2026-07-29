import { useState, useEffect } from 'react';
import { getMyProducts, createProduct, deleteSellerProduct } from '../../services/sellerService';
import { getCategories } from '../../services/productService';
import { Link } from 'react-router-dom';
import { resolveImageUrl } from '../../services/imageUrl';

const SellerDashboard = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isApproved, setIsApproved] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [basePrice, setBasePrice] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [stock, setStock] = useState(1);
    const [sku, setSku] = useState('');
    const [image, setImage] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const fetchData = async () => {
        try {
            const prodRes = await getMyProducts();
            setProducts(prodRes.data.products);
            setIsApproved(Boolean(prodRes.data.seller?.is_approved));

            const catRes = await getCategories();
            setCategories(catRes.data.categories);
        } catch (err) {
            console.error("Failed to load seller dashboard data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isApproved) {
            setError('Your seller account is awaiting administrator approval.');
            return;
        }
        setSubmitting(true);
        setError('');

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('base_price', basePrice);
        formData.append('category_id', categoryId);
        formData.append('stock', stock);
        formData.append('sku', sku);
        formData.append('variant_name', 'Standard');
        if (image) formData.append('images', image);

        try {
            await createProduct(formData);
            setTitle('');
            setDescription('');
            setBasePrice('');
            setCategoryId('');
            setSku('');
            setImage(null);
            await fetchData();
            alert('Art supply listed successfully!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to list art supply');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (productId) => {
        if (!window.confirm("Are you sure you want to delete this art supply?")) return;
        try {
            await deleteSellerProduct(productId);
            setProducts(products.filter(p => p.id !== productId));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete art supply');
        }
    };

    if (loading) return <div className="text-center mt-5"><div className="spinner-border"></div></div>;

    return (
        <div className="container mt-4 mb-5">
            <h2 className="mb-4">Seller Dashboard</h2>

            {!isApproved && <div className="alert alert-warning"><b>Approval pending.</b> Only approved sellers can add art supplies. An administrator must approve your seller account first.</div>}

            {/* Add New Product Form */}
            {isApproved && <div className="card shadow-sm p-4 mb-5">
                <h4 className="mb-3">List New Art Supply</h4>
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label">Art Supply Name</label>
                            <input type="text" className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} required />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">Base Price (₹)</label>
                            <input type="number" className="form-control" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} required />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">Category</label>
                            <select className="form-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-12">
                            <label className="form-label">Description</label>
                            <textarea className="form-control" rows="2" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">SKU (unique product code)</label>
                            <input type="text" className="form-control" value={sku} onChange={(e) => setSku(e.target.value)} required />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">Stock Quantity</label>
                            <input type="number" min="0" className="form-control" value={stock} onChange={(e) => setStock(e.target.value)} required />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Upload Image</label>
                            <input type="file" className="form-control" onChange={(e) => setImage(e.target.files[0])} required />
                        </div>
                        <div className="col-md-12 mt-3">
                            <button type="submit" className="btn btn-dark" disabled={submitting}>
                                {submitting ? 'Publishing...' : 'Publish Art Supply'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>}

            {/* My Listings */}
            <h4 className="mb-3">My Art Supplies ({products.length})</h4>
            {products.length === 0 ? (
                <p className="text-muted">You have not listed any art supplies yet.</p>
            ) : (
                <div className="row g-4">
                    {products.map(product => (
                        <div key={product.id} className="col-md-4">
                            <div className="card shadow-sm h-100">
                                <img 
                                    src={resolveImageUrl(product.image_url, 'https://via.placeholder.com/300')} 
                                    alt={product.title} 
                                    className="card-img-top" 
                                    style={{ height: '200px', objectFit: 'cover' }}
                                />
                                <div className="card-body d-flex flex-column">
                                    <h5 className="card-title fw-bold">{product.title}</h5>
                                    <p className="text-success fw-bold">₹{parseFloat(product.base_price).toFixed(2)}</p>
                                    <div className="mt-auto d-flex justify-content-between">
                                        <Link to={`/product/${product.id}`} className="btn btn-outline-dark btn-sm">View</Link>
                                        <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(product.id)}>Delete</button>
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

export default SellerDashboard;
