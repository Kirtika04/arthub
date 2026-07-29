import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderDetails, requestItemReturn } from '../services/orderService';
import { createPaymentOrder, selectCashOnDelivery, verifyPayment } from '../services/paymentService';
import { addProductReview } from '../services/reviewService';
import { resolveImageUrl } from '../services/imageUrl';

const OrderDetails = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [items, setItems] = useState([]);
    const [shipments, setShipments] = useState([]);
    const [shippingAddress, setShippingAddress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [paying, setPaying] = useState(false);
    const [notice, setNotice] = useState('');
    const [itemAction, setItemAction] = useState(null);

    const loadRazorpay = () => new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

    const handlePayment = async () => {
        setPaying(true);
        setError('');
        setNotice('');
        try {
            const loaded = await loadRazorpay();
            if (!loaded) throw new Error('Payment checkout could not be loaded. Check your internet connection.');
            const response = await createPaymentOrder(order.id);
            const paymentOrder = response.data.order;
            const razorpay = new window.Razorpay({
                key: response.data.keyId,
                amount: paymentOrder.amount,
                currency: paymentOrder.currency,
                name: 'ArtHub',
                description: `Payment for order #${order.id}`,
                order_id: paymentOrder.id,
                handler: async (result) => {
                    try {
                        await verifyPayment({ order_id: order.id, ...result });
                        setOrder(current => ({ ...current, status: 'confirmed', payment_status: 'successful' }));
                        setNotice('Payment successful. Your order is confirmed.');
                    } catch (err) {
                        setError(err.response?.data?.message || 'Payment verification failed.');
                    } finally {
                        setPaying(false);
                    }
                },
                modal: { ondismiss: () => setPaying(false) },
                theme: { color: '#212529' }
            });
            razorpay.on('payment.failed', result => {
                setError(result.error?.description || 'Payment failed. Please try again.');
                setPaying(false);
            });
            razorpay.open();
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Unable to start payment.');
            setPaying(false);
        }
    };

    const handleCod = async () => {
        setPaying(true);
        setError('');
        setNotice('');
        try {
            const response = await selectCashOnDelivery(order.id);
            setOrder(current => ({ ...current, status: 'confirmed', payment_status: 'pending', payment_method: 'cod' }));
            setNotice(response.message || 'Cash on delivery selected. Your order is confirmed.');
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to select cash on delivery.');
        } finally {
            setPaying(false);
        }
    };

    const handleReturn = async (item) => {
        const reason = window.prompt('Why would you like to return this item?');
        if (!reason) return;
        setItemAction(item.id);
        setError('');
        try {
            const response = await requestItemReturn(order.id, item.id, reason);
            setItems(current => current.map(row => row.id === item.id ? { ...row, return_id: response.data.returnId, return_status: 'requested', return_reason: reason } : row));
            setNotice('Return request submitted. You can track its status here.');
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to request a return.');
        } finally {
            setItemAction(null);
        }
    };

    const handleReview = async (item) => {
        const rating = Number(window.prompt('Rate this product from 1 to 5:'));
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) return setError('Please enter a rating from 1 to 5.');
        const comment = window.prompt('Write your review (optional):') || '';
        setItemAction(item.id);
        setError('');
        try {
            await addProductReview(item.product_id, { rating, comment });
            setNotice('Your review was saved. Thank you!');
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to save your review.');
        } finally {
            setItemAction(null);
        }
    };

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await getOrderDetails(id);
                setOrder(res.data.order);
                setItems(res.data.items || []);
                setShipments(res.data.shipments || []);
                setShippingAddress(res.data.shippingAddress || null);
            } catch (error) {
                console.error("Failed to fetch order details", error);
                setError(error.response?.data?.message || 'We could not load this order.');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    if (loading) return <div className="text-center mt-5"><div className="spinner-border"></div></div>;
    if (!order) return <div className="container mt-5"><h4>{error || 'Order not found.'}</h4><Link to="/orders">Back to Orders</Link></div>;

    return (
        <div className="container mt-5 mb-5">
            {notice && <div className="alert alert-success">{notice}</div>}
            {error && <div className="alert alert-danger">{error}</div>}
            <Link to="/orders" className="btn btn-outline-secondary mb-4">&larr; Back to Orders</Link>
            <div className="card shadow-sm p-4">
                <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
                    <div>
                        <h3>Order #{order.id}</h3>
                        <p className="text-muted mb-0">Placed on: {new Date(order.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                        <span className={`badge bg-${order.status === 'delivered' ? 'success' : 'warning'} fs-6 px-3 py-2`}>
                            {order.status}
                        </span>
                        {order.payment_status !== 'successful' && order.payment_method !== 'cod' && ['pending', 'confirmed'].includes(order.status) && (
                            <span className="ms-3 d-inline-flex gap-2">
                                <button className="btn btn-dark" onClick={handlePayment} disabled={paying}>
                                    {paying ? 'Please wait…' : 'Pay online'}
                                </button>
                                <button className="btn btn-outline-dark" onClick={handleCod} disabled={paying}>Cash on delivery</button>
                            </span>
                        )}
                        {order.payment_status === 'successful' && <div className="text-success small mt-2 text-end">Payment complete</div>}
                        {order.payment_method === 'cod' && <div className="text-success small mt-2 text-end">Cash on delivery selected</div>}
                    </div>
                </div>

                <h5 className="mb-3">Items Ordered</h5>
                <div className="list-group mb-4">
                    {items.map((item) => (
                        <div key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                                <img 
                                    src={resolveImageUrl(item.image_url, 'https://via.placeholder.com/60')} 
                                    alt={item.title} 
                                    style={{ width: '60px', height: '60px', objectFit: 'cover' }} 
                                    className="rounded me-3"
                                />
                                <div>
                                    <h6 className="mb-1">{item.title}</h6>
                                    <small className="text-muted">Qty: {item.quantity} | Price: ₹{Number(item.price_per_unit).toFixed(2)}</small>
                                </div>
                            </div>
                            <div className="text-end">
                                <span className="fw-bold d-block">₹{Number(item.subtotal).toFixed(2)}</span>
                                {order.status === 'delivered' && !item.return_status && <button className="btn btn-sm btn-outline-danger mt-2 me-2" disabled={itemAction === item.id} onClick={() => handleReturn(item)}>Return</button>}
                                {order.status === 'delivered' && <button className="btn btn-sm btn-outline-dark mt-2" disabled={itemAction === item.id} onClick={() => handleReview(item)}>Write review</button>}
                                {item.return_status && <div className="small mt-2"><b>Return:</b> {item.return_status}</div>}
                                {item.refund_status && <div className="small text-success"><b>Refund:</b> {item.refund_status}{item.refund_amount != null ? ` · ₹${Number(item.refund_amount).toFixed(2)}` : ''}</div>}
                            </div>
                        </div>
                    ))}
                </div>

                <h5 className="mb-3">Track order</h5>
                <div className="d-flex justify-content-between mb-4 position-relative">
                    {['confirmed', 'processing', 'shipped', 'delivered'].map((step, index) => {
                        const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
                        const reached = order.status !== 'cancelled' && statuses.indexOf(order.status) >= statuses.indexOf(step);
                        return <div key={step} className={`text-center flex-fill ${reached ? 'text-success' : 'text-muted'}`}><div className={`rounded-circle mx-auto mb-1 d-flex align-items-center justify-content-center ${reached ? 'bg-success text-white' : 'bg-light border'}`} style={{width:32,height:32}}>{reached ? '✓' : index + 1}</div><small className="text-capitalize">{step}</small></div>;
                    })}
                </div>
                {order.status === 'cancelled' && <div className="alert alert-danger">This order was cancelled.</div>}
                {shipments.map(shipment => (
                    <div key={shipment.id} className="border rounded p-3 mb-3">
                        <div className="d-flex justify-content-between"><b>{shipment.store_name}</b><span className="badge bg-secondary text-capitalize">{shipment.status.replace('_', ' ')}</span></div>
                        {shipment.courier_partner && <div className="small mt-2">Courier: <b>{shipment.courier_partner}</b></div>}
                        {shipment.tracking_number && <div className="small">Tracking number: <b>{shipment.tracking_number}</b></div>}
                        {shipment.shipped_at && <div className="small text-muted">Shipped on {new Date(shipment.shipped_at).toLocaleString()}</div>}
                        {!shipment.tracking_number && <div className="small text-muted mt-2">Tracking information will appear after dispatch.</div>}
                    </div>
                ))}

                <div className="row">
                    <div className="col-md-6">
                        <h5>Shipping Address</h5>
                        <p className="text-muted">{shippingAddress ? <>{shippingAddress.street_address}<br/>{shippingAddress.city}, {shippingAddress.state} — {shippingAddress.postal_code}<br/>{shippingAddress.country}</> : 'Delivery address unavailable'}</p>
                    </div>
                    <div className="col-md-6 text-md-end">
                        <h5>Total Amount: <span className="text-dark">₹{parseFloat(order.total_amount).toFixed(2)}</span></h5>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
