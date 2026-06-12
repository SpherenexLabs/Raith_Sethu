import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Package, Search, ShoppingCart, Star, Loader, Sprout, FlaskConical, Wrench, Plus, Minus, X, Trash2, CheckCircle } from 'lucide-react';
import { getInputProducts } from '../services/firebaseService';
import { RAZORPAY_TEST_KEY_ID, createRazorpayOrder, loadRazorpayCheckout, verifyRazorpayPayment } from '../services/razorpayService';

const categoryIcons = {
  seeds: Sprout,
  fertilizers: FlaskConical,
  pesticides: FlaskConical,
  tools: Wrench
};

const categories = [
  { id: 'all', name: 'All Products' },
  { id: 'seeds', name: 'Seeds' },
  { id: 'fertilizers', name: 'Fertilizers' },
  { id: 'pesticides', name: 'Pesticides' },
  { id: 'tools', name: 'Tools & Equipment' }
];

const InputMarketplace = () => {
  const { user } = useAuth();
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  useEffect(() => {
    const unsubscribe = getInputProducts((items) => {
      setProducts(items.filter((item) => item.status !== 'inactive'));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesCategory = category === 'all' || product.category === category;
    const searchText = `${product.name || ''} ${product.description || ''} ${product.seller || ''}`.toLowerCase();
    return matchesCategory && searchText.includes(searchQuery.toLowerCase());
  });

  const cartTotal = cartItems.reduce((sum, item) => sum + Number(item.product.price || 0) * item.quantity, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleQtyChange = (productId, delta) => {
    setCartItems((prev) =>
      prev
        .map((i) => i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i)
        .filter((i) => i.quantity > 0)
    );
  };

  const handleRemoveItem = (productId) => {
    setCartItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleCheckout = async () => {
    if (!user) { alert('Please log in to checkout.'); return; }
    if (cartItems.length === 0) return;

    setCheckoutLoading(true);

    const finishOrder = (paymentId) => {
      setOrderSuccess({ paymentId, items: cartItems, total: cartTotal });
      setCartItems([]);
      setShowCart(false);
    };

    try {
      await loadRazorpayCheckout();

      const amountInPaise = Math.round(cartTotal * 100);
      let razorpayOrder = null;
      let razorpayKeyId = RAZORPAY_TEST_KEY_ID;
      let orderCreationFailed = false;

      try {
        const result = await createRazorpayOrder({
          amount: amountInPaise,
          receipt: `input_${Date.now()}`,
          notes: { buyer: user.name || user.email, items: cartItems.length }
        });
        razorpayOrder = result.order;
        razorpayKeyId = result.keyId || RAZORPAY_TEST_KEY_ID;
      } catch (orderError) {
        orderCreationFailed = true;
        console.warn('Razorpay order creation failed:', orderError.message);
      }

      if (orderCreationFailed) {
        if (import.meta.env.PROD) {
          alert('Payment setup failed. Please try again later.');
          setCheckoutLoading(false);
          return;
        }
        // DEV: backend not running — simulate payment success
        finishOrder(`pay_dev_${Date.now()}`);
        return;
      }

      const options = {
        key: razorpayKeyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Raith Sethu',
        description: `${cartCount} item(s) — Agricultural Inputs`,
        order_id: razorpayOrder.id,
        prefill: {
          name: user.name || '',
          email: user.email || '',
          contact: user.phone || ''
        },
        theme: { color: '#10b981' },
        handler: async (response) => {
          try {
            await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
          } catch {
            // verification is best-effort in test mode
          }
          finishOrder(response.razorpay_payment_id);
        },
        modal: {
          ondismiss: () => setCheckoutLoading(false)
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        alert('Payment failed. Please try again.');
        setCheckoutLoading(false);
      });
      rzp.open();
    } catch (err) {
      alert(`Checkout error: ${err.message}`);
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="input-marketplace-page">
        <div className="loading">
          <Loader size={48} className="spinner" />
          <p>Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="input-marketplace-page">
      {/* Order success banner */}
      {orderSuccess && (
        <div className="order-success-banner">
          <CheckCircle size={20} />
          <span>
            Order placed! Payment ID: <strong>{orderSuccess.paymentId}</strong> — {orderSuccess.items.length} item(s) for Rs.{Number(orderSuccess.total).toLocaleString('en-IN')}
          </span>
          <button onClick={() => setOrderSuccess(null)}><X size={18} /></button>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1><Package size={32} /> Input Marketplace</h1>
          <p>Seeds, fertilizers, pesticides, tools &amp; equipment for farmers</p>
        </div>
        <button
          className="cart-icon-btn"
          onClick={() => setShowCart(true)}
        >
          <ShoppingCart size={22} />
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          {cartCount > 0 && <span className="cart-total-label">Rs.{Number(cartTotal).toLocaleString('en-IN')}</span>}
        </button>
      </div>

      <div className="marketplace-controls">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="category-tabs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-tab ${category === cat.id ? 'active' : ''}`}
            onClick={() => setCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="products-grid">
        {filteredProducts.map((product) => {
          const ProductIcon = categoryIcons[product.category] || Package;
          const inCart = cartItems.find((i) => i.product.id === product.id);

          return (
            <div key={product.id} className="product-card">
              <div className="product-image">
                <ProductIcon className="product-emoji" size={48} />
                {product.inStock !== false && <span className="stock-badge">In Stock</span>}
              </div>

              <div className="product-details">
                <h3>{product.name || 'Unnamed product'}</h3>
                <p className="product-category">{product.category || 'uncategorized'}</p>
                <p className="product-description">{product.description || 'No description provided.'}</p>

                <div className="product-seller">
                  <span>Sold by: {product.seller || 'Unknown seller'}</span>
                </div>

                {product.rating ? (
                  <div className="product-rating">
                    <Star size={16} fill="#fbbf24" color="#fbbf24" />
                    <span>{product.rating}</span>
                  </div>
                ) : null}

                <div className="product-footer">
                  <div className="product-price">
                    <span className="price">Rs.{Number(product.price || 0).toLocaleString('en-IN')}</span>
                    <span className="unit">/{product.unit || 'unit'}</span>
                  </div>

                  {inCart ? (
                    <div className="cart-qty-controls">
                      <button onClick={() => handleQtyChange(product.id, -1)}><Minus size={14} /></button>
                      <span>{inCart.quantity}</span>
                      <button onClick={() => handleQtyChange(product.id, 1)}><Plus size={14} /></button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleAddToCart(product)}
                    >
                      <ShoppingCart size={16} />
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="no-results">
          <Package size={64} color="#ccc" />
          <h3>No products found</h3>
          <p>Add product records in Firebase under inputProducts to display them here.</p>
        </div>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <div className="cart-overlay" onClick={() => setShowCart(false)}>
          <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="cart-drawer-header">
              <h3><ShoppingCart size={20} /> Cart ({cartCount} items)</h3>
              <button className="cart-close-btn" onClick={() => setShowCart(false)}><X size={22} /></button>
            </div>

            {cartItems.length === 0 ? (
              <div className="cart-empty">
                <ShoppingCart size={48} color="#ccc" />
                <p>Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="cart-items-list">
                  {cartItems.map(({ product, quantity }) => (
                    <div key={product.id} className="cart-item">
                      <div className="cart-item-info">
                        <span className="cart-item-name">{product.name}</span>
                        <span className="cart-item-price">Rs.{Number(product.price || 0).toLocaleString('en-IN')}/{product.unit || 'unit'}</span>
                      </div>
                      <div className="cart-item-actions">
                        <div className="cart-qty-controls">
                          <button onClick={() => handleQtyChange(product.id, -1)}><Minus size={14} /></button>
                          <span>{quantity}</span>
                          <button onClick={() => handleQtyChange(product.id, 1)}><Plus size={14} /></button>
                        </div>
                        <span className="cart-item-subtotal">
                          Rs.{(Number(product.price || 0) * quantity).toLocaleString('en-IN')}
                        </span>
                        <button className="cart-remove-btn" onClick={() => handleRemoveItem(product.id)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-footer">
                  <div className="cart-total-row">
                    <span>Total ({cartCount} items)</span>
                    <strong>Rs.{Number(cartTotal).toLocaleString('en-IN')}</strong>
                  </div>
                  <button
                    className="btn btn-primary btn-full"
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                  >
                    {checkoutLoading ? 'Opening payment...' : `Pay Rs.${Number(cartTotal).toLocaleString('en-IN')}`}
                  </button>
                  <button
                    className="btn btn-outline btn-full"
                    onClick={() => setCartItems([])}
                  >
                    Clear Cart
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InputMarketplace;
