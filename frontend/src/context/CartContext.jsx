import { createContext, useState, useContext, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { fetchCart, persistCartItem, deleteCartItem } from '../services/cartService';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        if (!user || user.role !== 'buyer') { setCart([]); return; }
        fetchCart().then(res => setCart(res.data.cart || [])).catch(() => setCart([]));
    }, [user]);

    const addToCart = async (product) => {
        // Design-preview products have no inventory row until the MySQL catalogue is seeded.
        // Keep them usable in the local preview cart instead of reporting them as unavailable.
        if (!user || user.role !== 'buyer' || !product.inventory_id) { setCart((prev) => [...prev, product]); return; }
        await persistCartItem(product);
        const response = await fetchCart();
        setCart(response.data.cart || []);
    };

    const removeFromCart = async (productId, inventoryId) => {
        if (user?.role === 'buyer' && inventoryId) await deleteCartItem(inventoryId);
        setCart((prev) => prev.filter(item => item.id !== productId));
    };

    const clearCart = () => setCart([]);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};
