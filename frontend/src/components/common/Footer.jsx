import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="site-footer">
    <div className="site-container footer-grid">
      <div>
        <Link className="brand footer-brand" to="/"><span className="brand-mark">A</span> ArtHub</Link>
        <p>Thoughtful tools and joyful materials for every kind of maker.</p>
      </div>
      <div><h6>Shop</h6><a href="/#collections">Paint & Draw</a><a href="/#collections">Paper & Journals</a><a href="/#collections">Creative gifts</a></div>
      <div><h6>About</h6><a href="/#journal">Our story</a><a href="/#journal">The journal</a><a href="/#journal">For artists</a></div>
      <div><h6>Stay inspired</h6><p>New materials, studio notes, and small sparks of joy.</p><div className="footer-email"><input placeholder="Your email" /><button aria-label="Subscribe">→</button></div></div>
    </div>
    <div className="site-container footer-bottom">© 2026 ArtHub &nbsp; · &nbsp; Made for making <span>Instagram &nbsp; Pinterest</span></div>
  </footer>
);

export default Footer;
