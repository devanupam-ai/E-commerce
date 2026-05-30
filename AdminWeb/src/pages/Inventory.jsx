import { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../api';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: '', price: '', sellingPrice: '', mrp: '', unit: '',
    stockQuantity: '', categoryId: '', description: '', imageUrl: '',
    images: []
  });
  const fileRef = useRef();

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [p, c] = await Promise.all([adminAPI.getProducts(), adminAPI.getCategories()]);
      setProducts(p.data);
      setCategories(c.data);
    } catch (e) {
      console.error('Failed to load products', e);
    }
    setLoading(false);
  };

  const openAdd = () => {
    setEditProduct(null);
    setForm({ name: '', price: '', sellingPrice: '', mrp: '', unit: '', stockQuantity: '', categoryId: '', description: '', imageUrl: '', images: [] });
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditProduct(p);
    setForm({
      name: p.name,
      price: p.price,
      sellingPrice: p.sellingPrice || '',
      mrp: p.mrp,
      unit: p.unit || '',
      stockQuantity: p.stockQuantity,
      categoryId: p.category?.id || '',
      description: p.description || '',
      imageUrl: p.imageUrl || '',
      images: (p.images || []).map(img => ({ imageUrl: img.imageUrl, isPrimary: img.isPrimary, sortOrder: img.sortOrder || 0 }))
    });
    setShowForm(true);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        const res = await adminAPI.uploadProductImage(file);
        const imageUrl = res.data.imageUrl;
        setForm(prev => ({
          ...prev,
          imageUrl: prev.imageUrl || imageUrl,
          images: [...prev.images, { imageUrl, isPrimary: prev.images.length === 0, sortOrder: prev.images.length }]
        }));
      }
    } catch (err) {
      alert('Image upload failed: ' + (err.response?.data?.error || err.message));
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeImage = (index) => {
    setForm(prev => {
      const newImages = prev.images.filter((_, i) => i !== index);
      if (newImages.length > 0) newImages[0].isPrimary = true;
      return { ...prev, images: newImages, imageUrl: newImages.length > 0 ? newImages[0].imageUrl : '' };
    });
  };

  const setPrimaryImage = (index) => {
    setForm(prev => {
      const newImages = prev.images.map((img, i) => ({ ...img, isPrimary: i === index }));
      return { ...prev, images: newImages, imageUrl: newImages[index].imageUrl };
    });
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      price: parseFloat(form.price),
      sellingPrice: form.sellingPrice ? parseFloat(form.sellingPrice) : parseFloat(form.price),
      mrp: parseFloat(form.mrp),
      stockQuantity: parseInt(form.stockQuantity),
      category: { id: parseInt(form.categoryId) },
      images: form.images.map((img, i) => ({ imageUrl: img.imageUrl, isPrimary: i === 0, sortOrder: i }))
    };
    try {
      if (editProduct) await adminAPI.updateProduct(editProduct.id, payload);
      else await adminAPI.addProduct(payload);
      setShowForm(false);
      load();
    } catch (err) {
      alert('Save failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleStockUpdate = async (id, current) => {
    const val = prompt(`Update stock for product (current: ${current}):`, current);
    if (val !== null && !isNaN(val)) {
      await adminAPI.updateStock(id, parseInt(val));
      load();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deactivate this product?')) { await adminAPI.deleteProduct(id); load(); }
  };

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = products.filter(p => p.stockQuantity <= 5 && p.isActive);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>🏪 Inventory & Products</h2>
        <button className="btn-primary" onClick={openAdd}>+ Add Product</button>
      </div>

      {lowStock.length > 0 && (
        <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <strong>⚠️ Low Stock Alert:</strong> {lowStock.map(p => `${p.name} (${p.stockQuantity} left)`).join(', ')}
        </div>
      )}

      <input placeholder="Search products or category..." value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: 12, border: '1px solid #E5E7EB', borderRadius: 8, marginBottom: 16, outline: 'none' }} />

      {loading ? <p>Loading...</p> : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #F3F4F6', textAlign: 'left' }}>
                {['Image', 'Product', 'Category', 'Price', 'MRP', 'Stock', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '12px 16px' }}>
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, border: '1px solid #E5E7EB' }} />
                    ) : p.images && p.images.length > 0 ? (
                      <img src={p.images[0].imageUrl} alt={p.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, border: '1px solid #E5E7EB' }} />
                    ) : (
                      <div style={{ width: 48, height: 48, background: '#F3F4F6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📦</div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>{p.unit}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{p.category?.emoji} {p.category?.name}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#6C3CE1' }}>₹{p.price}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B7280', textDecoration: 'line-through' }}>₹{p.mrp}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontWeight: 700, fontSize: 13,
                      color: p.stockQuantity <= 0 ? '#DC2626' : p.stockQuantity <= 5 ? '#D97706' : '#059669'
                    }}>
                      {p.stockQuantity <= 0 ? '❌ Out' : p.stockQuantity <= 5 ? `⚠️ ${p.stockQuantity}` : `✅ ${p.stockQuantity}`}
                    </span>
                    <button onClick={() => handleStockUpdate(p.id, p.stockQuantity)}
                      style={{ marginLeft: 8, fontSize: 11, padding: '2px 8px', background: '#E5E7EB', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                      Edit
                    </button>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: p.isActive ? '#059669' : '#DC2626' }}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
                    <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => openEdit(p)}>Edit</button>
                    <button onClick={() => handleDelete(p.id)}
                      style={{ padding: '6px 12px', fontSize: 12, background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: 560, maxHeight: '90vh', overflow: 'auto' }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>{editProduct ? 'Edit Product' : 'Add Product'}</h3>

            {/* Image Upload Section */}
            <div style={{ marginBottom: 16, padding: 16, background: '#F9FAFB', borderRadius: 8, border: '2px dashed #D1D5DB' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>📸 Product Images</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {form.images.map((img, i) => (
                  <div key={i} style={{ position: 'relative', width: 80, height: 80 }}>
                    <img src={img.imageUrl} alt={`Product ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, border: img.isPrimary ? '3px solid #6C3CE1' : '1px solid #E5E7EB' }} />
                    <button onClick={() => removeImage(i)} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#DC2626', color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    {!img.isPrimary && (
                      <button onClick={() => setPrimaryImage(i)} style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', fontSize: 9, padding: '2px 6px', background: '#6C3CE1', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap' }}>Set Primary</button>
                    )}
                    {img.isPrimary && (
                      <span style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', fontSize: 9, padding: '2px 6px', background: '#059669', color: '#fff', borderRadius: 4, whiteSpace: 'nowrap' }}>Primary</span>
                    )}
                  </div>
                ))}
                <label style={{ width: 80, height: 80, border: '2px dashed #D1D5DB', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9CA3AF', fontSize: 12 }}>
                  {uploading ? '⏳' : '➕ Add'}
                  <input type="file" accept="image/*" multiple ref={fileRef} onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>
              </div>
              <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>Upload product images. First image will be the primary image shown in customer app.</p>
            </div>

            {[
              { key: 'name', label: 'Product Name *' },
              { key: 'price', label: 'Price (₹) *', type: 'number' },
              { key: 'mrp', label: 'MRP (₹) *', type: 'number' },
              { key: 'sellingPrice', label: 'Selling Price / Discounted Price (₹)', type: 'number' },
              { key: 'unit', label: 'Unit (e.g. 500g, 1kg)' },
              { key: 'stockQuantity', label: 'Stock Quantity *', type: 'number' },
              { key: 'description', label: 'Description' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>{f.label}</label>
                <input type={f.type || 'text'} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 8, outline: 'none', fontSize: 14 }} />
              </div>
            ))}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Category *</label>
              <select value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}
                style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 8, outline: 'none', fontSize: 14 }}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-primary" style={{ flex: 1, padding: 12 }} onClick={handleSave} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Save Product'}
              </button>
              <button className="btn-secondary" style={{ flex: 1, padding: 12 }} onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
