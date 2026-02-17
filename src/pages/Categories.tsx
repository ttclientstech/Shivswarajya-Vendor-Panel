import React, { useState, useEffect } from 'react';
import { Box, Package, Plus, Search, Filter, ArrowLeft, X, Edit2, Trash2, DollarSign, UploadCloud, Save, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { FileUpload } from '../components/ui/FileUpload';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';
import { productService, type Product, type Category } from '../services/productService';
import { fileUploadService } from '../services/fileUploadService';
// Using Product type from service


export const Categories: React.FC = () => {
    // State
    const [view, setView] = useState<'categories' | 'products' | 'add-product'>('categories');
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null); // For Modal
    const [isModalEditMode, setIsModalEditMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingProducts, setIsFetchingProducts] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State for Add Product
    // We need to map UI fields to Product interface
    const [formData, setFormData] = useState({
        name: '',
        subCategory: '', // We can use 'tags' or 'description' to store this if no direct field, but Product has no subCategory. We might skip or put in description/tags.
        description: '',
        features: '', // Join with newline for UI, split for API
        price: '',
        sellingPrice: '',
        stock: '',
        unit: 'Piece', // Default
        images: [] as File[],
        sku: ''
    });

    // --- Actions ---

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (view === 'products' && selectedCategory) {
            fetchProducts();
        }
    }, [view, selectedCategory]);

    const fetchCategories = async () => {
        try {
            // Fetch categories and all vendor products in parallel to calculate counts
            const [categoriesData, productsResponse] = await Promise.all([
                productService.getCategories(),
                productService.getProducts(1, 1000)
            ]);

            // Calculate product counts per category
            const counts: Record<string, number> = {};
            if (productsResponse.products) {
                productsResponse.products.forEach((p) => {
                    // Handle populate objects or direct IDs
                    // Check p.category object first, then p.categoryId (which might also be populated)
                    const catId = p.category?._id ||
                        (typeof p.categoryId === 'object' && p.categoryId !== null ? (p.categoryId as any)._id : p.categoryId);

                    if (catId) {
                        counts[catId] = (counts[catId] || 0) + 1;
                    }
                });
                console.log('calculated vendor category counts:', counts);
            }

            const mapped = categoriesData.map(cat => ({
                ...cat,
                productCount: counts[cat._id] || 0
            }));

            setCategories(mapped);
        } catch (error) {
            console.error('Failed to fetch categories', error);
        }
    };

    const fetchProducts = async () => {
        setIsFetchingProducts(true);
        try {
            // Fetch all products (limit 1000 for now to get all)
            const response = await productService.getProducts(1, 1000);

            // Client-side filtering by category
            if (selectedCategory) {
                const filteredProducts = response.products.filter(
                    p => {
                        const pCatId = typeof p.categoryId === 'object' && p.categoryId !== null
                            ? (p.categoryId as any)._id
                            : p.categoryId;

                        // Handle potential populated category object in p.category
                        const pCatObjId = p.category ? p.category._id : null;

                        return pCatId === selectedCategory._id || pCatObjId === selectedCategory._id;
                    }
                );
                setProducts(filteredProducts);
            } else {
                setProducts(response.products);
            }
        } catch (error) {
            console.error('Failed to fetch products', error);
        } finally {
            setIsFetchingProducts(false);
        }
    };

    const handleCategoryClick = (category: Category) => {
        setSelectedCategory(category);
        setView('products');
    };

    const handleBackToCategories = () => {
        setSelectedCategory(null);
        setView('categories');
    };

    const handleBackToProducts = () => {
        setView('products');
    };

    const handleProductClick = (product: Product, editMode: boolean = false) => {
        setSelectedProduct(product);
        setIsModalEditMode(editMode);
    };

    const closeProductModal = () => {
        setSelectedProduct(null);
        setIsModalEditMode(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddProductSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Upload images
            const imageUrls = await Promise.all(
                formData.images.map(file => fileUploadService.uploadFile(file))
            );

            // If no images uploaded, use placeholder (or handle as error if required)
            if (imageUrls.length === 0) {
                imageUrls.push('https://placehold.co/600x400');
            }

            if (!selectedCategory) throw new Error("No category selected");

            const newProductData: Partial<Product> = {
                name: formData.name,
                categoryId: selectedCategory._id,
                description: formData.description,
                price: Number(formData.sellingPrice), // Selling Price
                compareAtPrice: Number(formData.price), // MRP
                stock: Number(formData.stock),
                sku: formData.sku,
                images: imageUrls,
                tags: formData.features.split('\n').filter(f => f.trim() !== ''),
                isActive: true // Default to active
            };

            await productService.createProduct(newProductData);

            alert('Product added successfully!');
            setView('products');
            setFormData({
                name: '', subCategory: '', description: '', features: '',
                price: '', sellingPrice: '', stock: '', unit: 'Piece', images: [], sku: ''
            });
            if (selectedCategory) fetchProducts();

        } catch (error: any) {
            console.error('Failed to create product', error);
            alert(`Failed to create product: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteProduct = async (productId: string) => {
        if (confirm('Are you sure you want to delete this product?')) {
            try {
                await productService.deleteProduct(productId);
                alert('Product deleted successfully');
                setProducts(prev => prev.filter(p => p._id !== productId));
            } catch (error) {
                console.error('Failed to delete product', error);
                alert('Failed to delete product');
            }
        }
    };

    // --- Sub-Components ---

    const CategoryCard = ({ category }: { category: Category }) => (
        <div
            onClick={() => handleCategoryClick(category)}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col h-full cursor-pointer"
        >
            {/* Image Area */}
            <div className="relative h-48 w-full overflow-hidden">
                <ImageWithFallback
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80"></div>

                {/* Status Badge */}
                <div className="absolute top-4 left-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${category.isActive
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-500 text-white'
                        }`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>

                {/* Title on Image */}
                <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-bold text-xl mb-1 truncate">{category.name}</h3>
                </div>
            </div>

            {/* Footer Content */}
            <div className="p-4 flex items-center justify-between border-t border-gray-50 bg-white md:mt-auto">
                <div className="flex items-center text-gray-500 text-sm font-medium">
                    <Package size={16} className="mr-2 text-orange-500" />
                    {category.productCount || 0} Products
                </div>
                <button
                    className="text-xs font-semibold text-orange-600 flex items-center hover:text-orange-700 transition-colors"
                >
                    View Products
                    <ChevronRight size={14} className="ml-1" />
                </button>
            </div>
        </div>
    );

    const ProductCard = ({ product }: { product: Product }) => (
        <div
            onClick={() => handleProductClick(product)}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all cursor-pointer group flex flex-col relative"
        >
            <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                <img
                    src={(product.images && product.images.length > 0) ? product.images[0] : ((product as any).image || 'https://placehold.co/400')}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                    <span className={`px-2 py-1 text-xs font-bold rounded-md bg-white/90 shadow-sm backdrop-blur-sm ${product.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                        {product.isActive ? 'Active' : 'Draft'}
                    </span>
                </div>
            </div>
            <div className="p-4 flex flex-col flex-1">
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-orange-600 transition-colors">{product.name}</h3>
                    <div className="flex gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); handleProductClick(product, true); }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Product"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product._id); }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Product"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
                {/* <p className="text-sm text-gray-500 mb-2">{product.category}</p> */}
                <div className="mt-auto flex items-center justify-between">
                    <div className="flex flex-col">
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                            <span className="text-xs text-gray-400 line-through">₹{product.compareAtPrice}</span>
                        )}
                        <span className="text-lg font-bold text-gray-900">₹{product.price}</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const ProductDetailModal = ({ product, initialEditMode = false }: { product: Product, initialEditMode?: boolean }) => {
        const [isEditing, setIsEditing] = useState(initialEditMode);
        const [isSaving, setIsSaving] = useState(false);
        const [isUploading, setIsUploading] = useState(false);
        const [editFormData, setEditFormData] = useState({
            name: product.name,
            description: product.description,
            price: product.price, // Selling Price
            compareAtPrice: product.compareAtPrice || product.price, // MRP
            stock: product.stock,
            isActive: product.isActive,
            images: product.images,
            tags: product.tags.join('\n') // For UI
        });

        if (!product) return null;

        const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
            const { name, value } = e.target;
            setEditFormData(prev => ({ ...prev, [name]: value }));
        };

        const handleImageUpdate = async (files: File[]) => {
            if (!files.length) return;

            setIsUploading(true);
            try {
                // Upload to Cloudinary
                const newImageUrls = await Promise.all(
                    files.map(file => fileUploadService.uploadFile(file))
                );

                setEditFormData(prev => ({
                    ...prev,
                    images: [...prev.images, ...newImageUrls]
                }));
            } catch (error) {
                console.error("Failed to upload images", error);
                alert("Failed to upload images. Please try again.");
            } finally {
                setIsUploading(false);
            }
        };

        const handleRemoveImage = (indexToRemove: number) => {
            setEditFormData(prev => ({
                ...prev,
                images: prev.images.filter((_, idx) => idx !== indexToRemove)
            }));
        };

        const handleSave = async () => {
            if (isUploading) return;

            setIsSaving(true);
            try {
                // 1. Prepare general update data (exclude isActive)
                const apiData = {
                    name: editFormData.name,
                    description: editFormData.description,
                    price: Number(editFormData.price),
                    compareAtPrice: Number(editFormData.compareAtPrice),
                    stock: Number(editFormData.stock),
                    // isActive: editFormData.isActive, // REMOVED: Sent separately
                    images: editFormData.images,
                    tags: editFormData.tags.split('\n').filter(t => t.trim() !== '')
                };

                // 2. Update general details
                await productService.updateProduct(product._id, apiData);

                // 3. Update status separately if changed
                if (editFormData.isActive !== product.isActive) {
                    await productService.updateProductStatus(product._id, editFormData.isActive);
                }

                // Update local list
                setProducts(prev => prev.map(p => p._id === product._id ? {
                    ...p,
                    ...apiData,
                    isActive: editFormData.isActive
                } : p));

                alert('Product updated successfully!');
                setIsEditing(false);
            } catch (error) {
                console.error('Failed to update product', error);
                alert('Failed to update product');
            } finally {
                setIsSaving(false);
            }
        };

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
                    <button
                        onClick={closeProductModal}
                        className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full z-10 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2">
                        {/* Image Section */}
                        <div className="bg-gray-100 p-8 flex flex-col items-center justify-center relative gap-4">
                            {editFormData.images.length > 0 ? (
                                <img
                                    src={editFormData.images[0]}
                                    alt={product.name}
                                    className="max-w-full max-h-[300px] object-contain drop-shadow-lg rounded-lg"
                                />
                            ) : (
                                <div className="text-gray-400 text-sm">No image available</div>
                            )}

                            {isEditing && (
                                <div className="w-full space-y-3">
                                    <div className="flex gap-2 overflow-x-auto py-2">
                                        {editFormData.images.map((img, idx) => (
                                            <div key={idx} className="relative group flex-shrink-0 w-16 h-16 border rounded-lg overflow-hidden">
                                                <img src={img} alt="" className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => handleRemoveImage(idx)}
                                                    className="absolute top-0 right-0 p-0.5 bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <FileUpload
                                        label="Update Image"
                                        accept="image/*"
                                        multiple={true}
                                        onFilesSelect={handleImageUpdate}
                                        placeholder="Upload new image"
                                        isLoading={isUploading}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Details Section */}
                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-start pr-12">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wide">
                                            {selectedCategory?.name}
                                        </span>
                                    </div>
                                    {isEditing ? (
                                        <Input
                                            name="name"
                                            value={editFormData.name}
                                            onChange={handleEditChange}
                                            className="text-2xl font-bold mb-2 bg-white"
                                            placeholder="Product Name"
                                        />
                                    ) : (
                                        <h2 className="text-3xl font-bold text-gray-900">{product.name}</h2>
                                    )}
                                </div>
                                {!isEditing ? (
                                    <Button variant="ghost" onClick={() => setIsEditing(true)} className="text-blue-600 hover:bg-blue-50">
                                        <Edit2 size={18} className="mr-2" /> Edit
                                    </Button>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button variant="ghost" onClick={() => setIsEditing(false)} className="text-gray-500">Cancel</Button>
                                        <Button onClick={handleSave} isLoading={isSaving} disabled={isUploading} className="bg-orange-600 text-white">Save</Button>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-end gap-3 pb-4 border-b border-gray-100">
                                {isEditing ? (
                                    <div className="flex gap-4 w-full">
                                        <div className="flex-1">
                                            <label className="text-xs text-gray-500">Selling Price</label>
                                            <Input name="price" type="number" value={editFormData.price} onChange={handleEditChange} className="bg-white" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs text-gray-500">MRP</label>
                                            <Input name="compareAtPrice" type="number" value={editFormData.compareAtPrice} onChange={handleEditChange} className="bg-white" />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <span className="text-4xl font-bold text-gray-900">₹{product.price}</span>
                                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                                            <>
                                                <span className="text-lg text-gray-400 line-through mb-1">₹{product.compareAtPrice}</span>
                                                <span className="text-sm text-green-600 font-bold mb-2 ml-auto">
                                                    {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}% OFF
                                                </span>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-2">Description</h4>
                                    {isEditing ? (
                                        <textarea
                                            name="description"
                                            value={editFormData.description}
                                            onChange={handleEditChange}
                                            rows={4}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-sm bg-white"
                                        />
                                    ) : (
                                        <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
                                    )}
                                </div>

                                {!isEditing && product.tags.length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-gray-900 mb-2">Key Features (Tags)</h4>
                                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                            {product.tags.map((tag, idx) => (
                                                <li key={idx}>{tag}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Stock Available</p>
                                        {isEditing ? (
                                            <Input name="stock" type="number" value={editFormData.stock} onChange={handleEditChange} className="bg-white" />
                                        ) : (
                                            <p className="text-lg font-bold text-gray-900">{product.stock}</p>
                                        )}
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
                                        {isEditing ? (
                                            <Select
                                                name="isActive"
                                                value={editFormData.isActive ? 'true' : 'false'}
                                                onChange={(e) => setEditFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                                                options={[
                                                    { value: 'true', label: 'Active' },
                                                    { value: 'false', label: 'Draft' }
                                                ]}
                                            />
                                        ) : (
                                            <p className={`text-lg font-bold ${product.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                                                {product.isActive ? 'Active' : 'Draft'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // --- Main Renders ---

    // 1. Categories View
    if (view === 'categories') {
        const filteredCategories = categories.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
            <div className="space-y-8 animate-fadeIn">
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Product Categories</h1>
                        <p className="text-gray-500 text-sm mt-1">Select a category to manage products.</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search categories..."
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-200 transition-all text-gray-700 placeholder-gray-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {categories.length === 0 ? (
                        <div className="col-span-full text-center py-20 text-gray-500">
                            {searchTerm ? 'No categories found matching your search.' : 'No categories available.'}
                        </div>
                    ) : filteredCategories.map(category => (
                        <CategoryCard key={category._id} category={category} />
                    ))}
                </div>
            </div>
        );
    }

    // 2. Products List View
    if (view === 'products' && selectedCategory) {
        return (
            <div className="space-y-6 animate-fadeIn">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" onClick={handleBackToCategories} className="text-gray-500 hover:text-gray-900 -ml-2 p-2">
                            <ArrowLeft size={20} />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{selectedCategory.name}</h1>
                            <p className="text-gray-500 text-sm">Manage products in this category</p>
                        </div>
                    </div>
                    <Button onClick={() => setView('add-product')} className="bg-orange-600 hover:bg-orange-700 text-white">
                        <Plus size={20} className="mr-2" /> Add Product
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex-1 min-w-[200px]">
                        <Input placeholder="Search products..." icon={<Search size={18} />} className="bg-gray-50" />
                    </div>
                    <Button variant="outline" className="text-gray-600 border-gray-200">
                        <Filter size={18} className="mr-2" /> Filters
                    </Button>
                </div>

                {/* Products Grid */}
                {isFetchingProducts ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-orange-600" size={48} />
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {products.map(product => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <Package size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">No products found.</p>
                        <Button variant="ghost" onClick={() => setView('add-product')} className="text-orange-600 mt-2">
                            Add the first product
                        </Button>
                    </div>
                )}

                {/* Detail Modal */}
                {selectedProduct && <ProductDetailModal product={selectedProduct} initialEditMode={isModalEditMode} />}
            </div>
        );
    }

    // 3. Add Product View
    if (view === 'add-product') {
        return (
            <div className="max-w-4xl mx-auto animate-fadeIn pb-20">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" onClick={handleBackToProducts} className="text-gray-500 hover:text-gray-900 -ml-2">
                        <ArrowLeft size={20} className="mr-2" /> Cancel
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
                        <p className="text-gray-500 text-sm">Adding to: <span className="font-bold text-orange-600">{selectedCategory?.name}</span></p>
                    </div>
                </div>

                <form onSubmit={handleAddProductSubmit} className="space-y-8">
                    {/* 1. Basic Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Box size={20} /></div>
                            <h2 className="text-lg font-bold text-gray-900">Basic Information</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <Input
                                    label="Product Name"
                                    name="name"
                                    placeholder="e.g., Organic Alphonso Mangoes"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <Input
                                label="Category"
                                name="category"
                                value={selectedCategory?.name}
                                disabled
                                className="bg-gray-50/50 text-gray-500 cursor-not-allowed"
                            />
                            <Input
                                label="Sub-category"
                                name="subCategory"
                                placeholder="e.g., Fruits, Menswear"
                                value={formData.subCategory}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    {/* 2. Details */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Edit2 size={20} /></div>
                            <h2 className="text-lg font-bold text-gray-900">Product Details</h2>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-sm font-semibold text-gray-700 ml-1 mb-2 block">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-sm bg-white text-gray-900 placeholder-gray-400"
                                    placeholder="Describe your product..."
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 ml-1 mb-2 block">Key Features (Tags)</label>
                                <textarea
                                    name="features"
                                    value={formData.features}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-sm bg-white text-gray-900 placeholder-gray-400"
                                    placeholder="e.g., Organic, Hand-made, 100% Cotton (One per line)"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 3. Pricing & Inventory */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
                            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><DollarSign size={20} /></div>
                            <h2 className="text-lg font-bold text-gray-900">Pricing & Inventory</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="MRP (Base Price)"
                                name="price"
                                type="number"
                                placeholder="0.00"
                                value={formData.price}
                                onChange={handleInputChange}
                            />
                            <Input
                                label="Selling Price"
                                name="sellingPrice"
                                type="number"
                                placeholder="0.00"
                                value={formData.sellingPrice}
                                onChange={handleInputChange}
                                required
                            />
                            <Input
                                label="Stock Quantity"
                                name="stock"
                                type="number"
                                placeholder="0"
                                value={formData.stock}
                                onChange={handleInputChange}
                                required
                            />
                            <Input
                                label="SKU (Optional)"
                                name="sku"
                                placeholder="PROD-001"
                                value={formData.sku}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    {/* 4. Media */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
                            <div className="p-2 bg-pink-50 text-pink-600 rounded-lg"><UploadCloud size={20} /></div>
                            <h2 className="text-lg font-bold text-gray-900">Product Images</h2>
                        </div>

                        <div className="space-y-4">
                            <FileUpload
                                label="Upload Images"
                                accept="image/*"
                                multiple={true}
                                onFilesSelect={(files) => setFormData(prev => ({ ...prev, images: files }))}
                                placeholder="Drag and drop product images here"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-4 pt-4">
                        <Button type="button" variant="outline" onClick={handleBackToProducts} className="px-6">Cancel</Button>
                        <Button type="submit" isLoading={isLoading} className="bg-orange-600 hover:bg-orange-700 text-white px-8">
                            <Save size={18} className="mr-2" /> Save Product
                        </Button>
                    </div>
                </form>
            </div>
        );
    }

    return null;
};
