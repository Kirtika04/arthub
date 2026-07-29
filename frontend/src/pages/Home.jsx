import { useEffect, useMemo, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllProducts, getCategories } from '../services/productService';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { addToWishlist } from '../services/wishlistService';
import { resolveImageUrl } from '../services/imageUrl';

const fallbackProducts = [
  { id: 'watercolor-set', title: 'Botanical Watercolour Set', base_price: 1495, category_name: 'Paint & Colour', image_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=85', badge: 'Best seller' },
  { id: 'sketchbook', title: 'The Everyday Sketchbook', base_price: 780, category_name: 'Paper & Journals', image_url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=85', badge: 'New' },
  { id: 'brushes', title: 'Studio Brush Collection', base_price: 1280, category_name: 'Paint & Colour', image_url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=900&q=85' },
  { id: 'pastels', title: 'Soft Pastels — Garden', base_price: 1890, category_name: 'Drawing', image_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=85', badge: 'Limited' },
];

const categoryImages = {
  'Oil Paints': 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=900&q=85',
  'Varnishes & Mediums': 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=900&q=85',
  'Brushes': 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=900&q=85',
  'Canvas & Boards': 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=900&q=85',
  'Markers & Inks': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=85',
  'Drawing': 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=900&q=85',
};
const imageFor = (product) => resolveImageUrl(product.image_url, categoryImages[product.category_name] || fallbackProducts[0].image_url);

const Home = () => {
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [apiProducts, setApiProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => { Promise.all([getAllProducts(), getCategories()]).then(([products, cats]) => { setApiProducts(products.data.products || []); setCategories(cats.data.categories || []); }).catch(() => {}); }, []);
  const products = apiProducts.length ? apiProducts : fallbackProducts;
  const filters = ['All', ...categories.map(c => c.name), 'Paint & Colour', 'Drawing', 'Paper & Journals'].filter((v, i, a) => a.indexOf(v) === i);
  const filtered = useMemo(() => products.filter(p => (activeCategory === 'All' || p.category_name === activeCategory) && p.title.toLowerCase().includes(search.toLowerCase())), [products, activeCategory, search]);
  const add = async (item) => {
    try { await addToCart(item); setNotice(`${item.title} added to your cart`); }
    catch (error) { setNotice(error.response?.data?.message || 'Could not add this product to cart.'); }
    setTimeout(() => setNotice(''), 2500);
  };
  const save = async (item, event) => {
    event.preventDefault();
    if (!user) { navigate('/login'); return; }
    if (typeof item.id !== 'number') { setNotice('Wishlist is available for products in the ArtHub catalogue.'); return; }
    try { await addToWishlist(item.id); setNotice(`${item.title} saved to your wishlist`); }
    catch (error) { setNotice(error.response?.data?.message || 'Could not save this item.'); }
    setTimeout(() => setNotice(''), 2500);
  };

  return <>
    {notice && <div className="cart-toast">✓ {notice}</div>}
    <section className="hero">
      <div className="site-container hero-grid">
        <div className="hero-copy"><p className="eyebrow">MATERIALS WITH A LITTLE MAGIC</p><h1>Make room for<br/><em>your next idea.</em></h1><p className="hero-text">Beautiful, hardworking art supplies chosen to turn every creative impulse into something you can hold.</p><a href="#shop" className="btn-primary-art">Shop new arrivals <span>→</span></a><div className="hero-note"><div className="mini-avatars"><i></i><i></i><i></i></div><span>Loved by 12,000+ makers</span></div></div>
        <div className="hero-art"><div className="hero-arch"></div><img src="https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=90" alt="Artist painting in a studio"/><div className="floating-card"><span>✦</span><div><b>Made to be used</b><small>Not just admired.</small></div></div></div>
      </div>
    </section>
    <section id="collections" className="collections site-container"><div className="section-heading"><div><p className="eyebrow">EXPLORE BY MOOD</p><h2>Find your favourite <em>medium.</em></h2></div><a href="#shop">See all materials →</a></div><div className="collection-grid">
      {[['Paint & Colour','https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=850&q=85'],['Paper & Journals','https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=850&q=85'],['Tools & Essentials','https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=850&q=85']].map(([name, image]) => <a className="collection-card" href="#shop" key={name}><img src={image} alt={name}/><div><span>Explore</span><h3>{name}</h3></div></a>)}
    </div></section>
    <section id="shop" className="products-section"><div className="site-container"><div className="section-heading"><div><p className="eyebrow">THE GOOD STUFF</p><h2>Fresh from the <em>studio.</em></h2></div><div className="product-search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search materials"/></div></div><div className="filter-row">{filters.map(f => <button onClick={() => setActiveCategory(f)} className={activeCategory === f ? 'active' : ''} key={f}>{f}</button>)}</div><div className="product-grid">{filtered.slice(0, 8).map(product => <article className="product-card" key={product.id}><Link to={typeof product.id === 'number' ? `/product/${product.id}` : '#shop'} className="product-image"><img src={imageFor(product)} alt={product.title}/>{product.badge && <span>{product.badge}</span>}</Link><div className="product-info"><p>{product.category_name || 'Art supplies'}</p><h3>{product.title}</h3><strong>₹{Number(product.base_price).toLocaleString('en-IN')}</strong><div className="product-actions"><button onClick={() => add(product)}>Add to cart</button><button onClick={e => save(product, e)}>♡ Save</button></div></div></article>)}</div>{!filtered.length && <div className="empty-products">No materials match that search. Try another creative avenue.</div>}</div></section>
    <section className="values"><div className="site-container values-grid"><div><span>✦</span><h3>Artist-tested</h3><p>Tools worth reaching for, again and again.</p></div><div><span>◌</span><h3>Thoughtfully sourced</h3><p>Made by good people, with care.</p></div><div><span>↗</span><h3>Delivered with joy</h3><p>Free shipping on orders over ₹1,499.</p></div></div></section>
    <section id="journal" className="journal site-container"><div className="journal-image"><img src="https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=1000&q=85" alt="Artist's desk"/></div><div className="journal-copy"><p className="eyebrow">THE ARTHUB JOURNAL</p><h2>There’s no wrong way to <em>begin.</em></h2><p>Prompts, palettes and tiny studio rituals to help you make more of the work that feels like you.</p><a href="#journal">Visit the journal <span>→</span></a></div></section>
  </>;
};
export default Home;
