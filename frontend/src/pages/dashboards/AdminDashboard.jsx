import { useState, useEffect } from 'react';
import { 
    getAdminStats, 
    getAdminSellers, 
    toggleSellerApproval, 
    getAdminCategories, 
    createCategory,
    deleteCategory,
    getAdminUsers,
    getAdminOrders,
    approveAdminOrder
} from '../../services/adminService';

const AdminDashboard = () => {
    const [stats, setStats] = useState({});
    const [sellers, setSellers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [users, setUsers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('stats');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [updatingOrder, setUpdatingOrder] = useState(null);
    
    // New category form state
    const [newCatName, setNewCatName] = useState('');
    const [newCatDesc, setNewCatDesc] = useState('');

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setError('');
        try {
            if (activeTab === 'stats') {
                const res = await getAdminStats();
                setStats(res.data);
            } else if (activeTab === 'sellers') {
                const res = await getAdminSellers();
                setSellers(res.data.sellers);
            } else if (activeTab === 'categories') {
                const res = await getAdminCategories();
                setCategories(res.data.categories);
            } else if (activeTab === 'users') {
                const res = await getAdminUsers();
                setUsers(res.data.users);
            } else if (activeTab === 'orders') {
                const res = await getAdminOrders();
                setOrders(res.data.orders || []);
            }
        } catch (error) {
            console.error("Failed to load admin data", error);
            setError(error.response?.data?.message || 'Failed to load admin data');
        }
    };

    const handleApproveOrder = async (orderId) => {
        setUpdatingOrder(orderId);
        setMessage('');
        setError('');
        try {
            const res = await approveAdminOrder(orderId);
            setOrders(current => current.map(order => order.id === orderId ? { ...order, status: 'confirmed' } : order));
            setMessage(res.message || `Order #${orderId} approved.`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to approve order');
        } finally {
            setUpdatingOrder(null);
        }
    };

    const handleToggleSeller = async (id) => {
        try {
            await toggleSellerApproval(id);
            loadData();
        } catch (error) {
            alert('Failed to update seller status');
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        try {
            await createCategory({ name: newCatName, description: newCatDesc });
            setNewCatName('');
            setNewCatDesc('');
            loadData();
        } catch (error) {
            alert('Failed to create category');
        }
    };

    const handleDeleteCategory = async (category) => {
        if (!window.confirm(`Remove the category "${category.name}"?`)) return;
        setMessage('');
        setError('');
        try {
            const res = await deleteCategory(category.id);
            setCategories(current => current.filter(item => item.id !== category.id));
            setMessage(res.message || 'Category removed successfully.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to remove category');
        }
    };

    return (
        <div className="container mt-5 mb-5">
            <h2 className="mb-4">Admin Dashboard</h2>
            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Navigation Tabs */}
            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>Overview</button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === 'sellers' ? 'active' : ''}`} onClick={() => setActiveTab('sellers')}>Manage Sellers</button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>Categories</button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Users</button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>Orders</button>
                </li>
            </ul>

            {/* Tab 1: Stats */}
            {activeTab === 'stats' && (
                <div className="row g-4">
                    <div className="col-md-3"><div className="card p-3 shadow-sm bg-light"><h5>Total Users</h5><h3>{stats.totalUsers ?? 0}</h3></div></div>
                    <div className="col-md-3"><div className="card p-3 shadow-sm bg-light"><h5>Active Sellers</h5><h3>{stats.activeSellers ?? 0}</h3></div></div>
                    <div className="col-md-3"><div className="card p-3 shadow-sm bg-light"><h5>Products</h5><h3>{stats.totalProducts ?? 0}</h3></div></div>
                    <div className="col-md-3"><div className="card p-3 shadow-sm bg-light"><h5>Total Revenue</h5><h3>₹{parseFloat(stats.totalRevenue || 0).toFixed(2)}</h3></div></div>
                </div>
            )}

            {/* Tab 2: Manage Sellers */}
            {activeTab === 'sellers' && (
                <div className="card shadow-sm">
                    <div className="card-body p-0">
                        <table className="table table-hover mb-0">
                            <thead className="table-light">
                                <tr><th>Store Name</th><th>Owner</th><th>Email</th><th>Phone</th><th>Status</th><th>Action</th></tr>
                            </thead>
                            <tbody>
                                {sellers.map(s => (
                                    <tr key={s.id}>
                                        <td>{s.store_name}</td>
                                        <td>{s.name}</td>
                                        <td>{s.email}</td>
                                        <td>{s.phone || 'N/A'}</td>
                                        <td><span className={`badge bg-${s.is_approved ? 'success' : 'warning'}`}>{s.is_approved ? 'Approved' : 'Pending'}</span></td>
                                        <td>
                                            <button className={`btn btn-sm btn-${s.is_approved ? 'danger' : 'success'}`} onClick={() => handleToggleSeller(s.id)}>
                                                {s.is_approved ? 'Revoke' : 'Approve'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tab 3: Categories */}
            {activeTab === 'categories' && (
                <div className="row">
                    <div className="col-md-5">
                        <div className="card shadow-sm p-4">
                            <h5 className="mb-3">Add Category</h5>
                            <form onSubmit={handleCreateCategory}>
                                <div className="mb-3">
                                    <label className="form-label">Category Name</label>
                                    <input type="text" className="form-control" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Description</label>
                                    <textarea className="form-control" value={newCatDesc} onChange={(e) => setNewCatDesc(e.target.value)} rows="2"></textarea>
                                </div>
                                <button type="submit" className="btn btn-dark w-100">Add Category</button>
                            </form>
                        </div>
                    </div>
                    <div className="col-md-7">
                        <div className="card shadow-sm">
                            <div className="card-body p-0">
                                <table className="table table-hover mb-0">
                                    <thead className="table-light"><tr><th>ID</th><th>Name</th><th>Description</th><th>Action</th></tr></thead>
                                    <tbody>
                                        {categories.map(cat => (
                                            <tr key={cat.id}><td>{cat.id}</td><td>{cat.name}</td><td>{cat.description || '-'}</td><td><button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteCategory(cat)}>Remove</button></td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 4: Users */}
            {activeTab === 'users' && (
                <div className="card shadow-sm">
                    <div className="card-body p-0">
                        <table className="table table-hover mb-0">
                            <thead className="table-light"><tr><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Status</th></tr></thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td>{u.name}</td><td>{u.email}</td>
                                        <td><span className="badge bg-secondary">{u.role}</span></td>
                                        <td>{u.phone || 'N/A'}</td>
                                        <td><span className={`badge bg-${u.is_active ? 'success' : 'danger'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'orders' && (
                <div className="card shadow-sm">
                    <div className="card-body p-0 table-responsive">
                        <table className="table table-hover mb-0">
                            <thead className="table-light">
                                <tr><th>Order</th><th>Buyer</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th>Action</th></tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id}>
                                        <td>#{order.id}</td>
                                        <td>{order.buyer_name}<div className="small text-muted">{order.buyer_email}</div></td>
                                        <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                        <td>{order.total_items}</td>
                                        <td>₹{Number(order.total_amount).toFixed(2)}</td>
                                        <td><span className={`badge bg-${order.status === 'confirmed' ? 'success' : order.status === 'cancelled' ? 'danger' : 'warning'}`}>{order.status}</span></td>
                                        <td>
                                            <button className="btn btn-sm btn-success" disabled={order.status !== 'pending' || updatingOrder === order.id} onClick={() => handleApproveOrder(order.id)}>
                                                {updatingOrder === order.id ? 'Approving…' : order.status === 'pending' ? 'Approve' : 'Approved'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {!orders.length && <tr><td colSpan="7" className="text-center text-muted py-4">No orders found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
