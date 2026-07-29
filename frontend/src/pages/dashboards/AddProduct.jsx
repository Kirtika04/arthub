import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProduct, getMyProducts } from '../../services/sellerService';
import { getCategories } from '../../services/productService';

const AddProduct = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [approvalChecked, setApprovalChecked] = useState(false);
    const [isApproved, setIsApproved] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        base_price: '',
        category_id: '',
        sku: '',
        variant_name: 'Standard',
        stock: ''
    });
    const [images, setImages] = useState(null);

    useEffect(() => {
        getCategories().then(res => setCategories(res.data.categories)).catch(console.error);
        getMyProducts().then(res => setIsApproved(Boolean(res.data.seller?.is_approved))).catch(err => setError(err.response?.data?.message || 'Unable to verify seller approval.')).finally(() => setApprovalChecked(true));
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setImages(e.target.files);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isApproved) return setError('Only approved sellers can add art supplies.');
        setLoading(true);
        setError('');

        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        
        if (images) {
            for (let i = 0; i < images.length; i++) {
                data.append('images', images[i]);
            }
        }

        try {
            await createProduct(data);
            navigate('/seller/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add product.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5 mb-5">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card shadow-sm">
                        <div className="card-header bg-dark text-white fw-bold">Add New Product</div>
                        <div className="card-body p-4">
                            {error && <div className="alert alert-danger">{error}</div>}
                            {approvalChecked && !isApproved && <div className="alert alert-warning">Your seller account is awaiting administrator approval. Product creation is disabled.</div>}
                            
                            <form onSubmit={handleSubmit}>
                                <h5 className="mb-3 border-bottom pb-2">Basic Info</h5>
                                <div className="mb-3">
                                    <label className="form-label">Product Title</label>
                                    <input type="text" name="title" className="form-control" onChange={handleChange} required />
                                </div>
                                
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label">Category</label>
                                        <select name="category_id" className="form-select" onChange={handleChange} required>
                                            <option value="">Select Category</option>
                                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Base Price (₹)</label>
                                        <input type="number" step="0.01" name="base_price" className="form-control" onChange={handleChange} required />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label">Description</label>
                                    <textarea name="description" className="form-control" rows="3" onChange={handleChange}></textarea>
                                </div>

                                <h5 className="mb-3 border-bottom pb-2">Inventory (Default Variant)</h5>
                                <div className="row mb-4">
                                    <div className="col-md-4">
                                        <label className="form-label">SKU (Unique)</label>
                                        <input type="text" name="sku" className="form-control" onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Variant Name</label>
                                        <input type="text" name="variant_name" value={formData.variant_name} className="form-control" onChange={handleChange} />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Stock Quantity</label>
                                        <input type="number" name="stock" className="form-control" onChange={handleChange} required />
                                    </div>
                                </div>

                                <h5 className="mb-3 border-bottom pb-2">Images</h5>
                                <div className="mb-4">
                                    <label className="form-label">Upload Product Images (Max 5)</label>
                                    <input type="file" name="images" className="form-control" multiple accept="image/*" onChange={handleFileChange} />
                                </div>

                                <div className="d-flex justify-content-end">
                                    <button type="button" className="btn btn-light me-2" onClick={() => navigate('/seller/dashboard')}>Cancel</button>
                                    <button type="submit" className="btn btn-dark" disabled={loading || !approvalChecked || !isApproved}>
                                        {loading ? 'Saving...' : 'Add Product'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddProduct;
