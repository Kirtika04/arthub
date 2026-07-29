import { useState, useEffect } from 'react';
import { getUserOrders } from '../services/orderService';
import { Link } from 'react-router-dom';

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await getUserOrders();
                setOrders(res.data.orders);
            } catch (error) {
                console.error("Failed to fetch orders", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    if (loading) {
        return <div className="text-center mt-5"><div className="spinner-border"></div></div>;
    }

    return (
        <div className="container mt-5 mb-5">
            <h2 className="mb-4">My Orders</h2>
            {orders.length === 0 ? (
                <div className="card shadow-sm p-4 text-center">
                    <p className="mb-3">You haven't placed any orders yet.</p>
                    <Link to="/" className="btn btn-dark w-auto mx-auto">Start Shopping</Link>
                </div>
            ) : (
                <div className="card shadow-sm">
                    <div className="card-body p-0">
                        <table className="table table-hover mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Order ID</th>
                                    <th>Date</th>
                                    <th>Items</th>
                                    <th>Total Amount</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id}>
                                        <td>#{order.id}</td>
                                        <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                        <td>{order.total_items}</td>
                                        <td>₹{parseFloat(order.total_amount).toFixed(2)}</td>
                                        <td>
                                            <span className={`badge bg-${order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'danger' : 'warning'}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td>
                                            <Link to={`/order/${order.id}`} className="btn btn-sm btn-outline-dark">View</Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyOrders;
