'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Plus, Minus, Trash2, Printer, DollarSign, CreditCard, ArrowRightLeft, UserSearch, X } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Variant {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  salePrice: number;
  taxExempt: boolean;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  images: string[];
  variants: Variant[];
}

interface CartItem {
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  price: number;
  quantity: number;
  stock: number;
}

interface PosClient {
  id: string;
  nit: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface SaleResult {
  id: string;
  saleNumber: string;
  clientNit: string;
  clientName: string;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  cashReceived: number | null;
  change: number | null;
  createdAt: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }[];
  seller: { firstName: string; lastName: string };
}

type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER';

export default function PosPage() {
  // Product search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const searchRef = useRef<HTMLInputElement>(null);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);

  // Client
  const [clientNit, setClientNit] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [searchingClient, setSearchingClient] = useState(false);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const [notes, setNotes] = useState('');

  // Sale state
  const [processing, setProcessing] = useState(false);
  const [completedSale, setCompletedSale] = useState<SaleResult | null>(null);

  // Today summary
  const [todaySummary, setTodaySummary] = useState({ salesCount: 0, totalSales: 0 });

  // Toast
  const [toastMsg, setToastMsg] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ message, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Computed
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal - discount;
  const cashReceivedNum = parseFloat(cashReceived) || 0;
  const change = paymentMethod === 'CASH' ? cashReceivedNum - total : 0;

  // Load today summary
  const loadSummary = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/pos/sales/today');
      setTodaySummary(data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // Focus search on load
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // Product search with debounce
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await apiClient.get(`/pos/products/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchQuery]);

  // Search client by NIT
  const handleNitSearch = async () => {
    if (!clientNit.trim()) return;
    setSearchingClient(true);
    try {
      const { data } = await apiClient.get(`/pos/clients/search?nit=${encodeURIComponent(clientNit)}`);
      if (data) {
        setClientName(data.name);
        setClientAddress(data.address || '');
        setClientPhone(data.phone || '');
        showToast('Cliente encontrado');
      } else {
        showToast('Cliente nuevo — ingrese el nombre');
      }
    } catch {
      showToast('Cliente nuevo — ingrese el nombre');
    } finally {
      setSearchingClient(false);
    }
  };

  // Add product variant to cart
  const addToCart = (product: Product, variant: Variant) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.variantId === variant.id);
      if (existing) {
        if (existing.quantity >= variant.stock) {
          showToast('Stock insuficiente', 'error');
          return prev;
        }
        return prev.map((item) =>
          item.variantId === variant.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          variantId: variant.id,
          productName: product.name,
          variantName: variant.name,
          sku: variant.sku,
          price: Number(variant.salePrice),
          quantity: 1,
          stock: variant.stock,
        },
      ];
    });

    setSearchQuery('');
    setSearchResults([]);
    searchRef.current?.focus();
  };

  // Update quantity
  const updateQuantity = (variantId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.variantId !== variantId) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.stock) {
            showToast('Stock insuficiente', 'error');
            return item;
          }
          return { ...item, quantity: newQty };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeItem = (variantId: string) => {
    setCart((prev) => prev.filter((item) => item.variantId !== variantId));
  };

  // Process sale
  const processSale = async () => {
    if (cart.length === 0) {
      showToast('Agregue productos a la venta', 'error');
      return;
    }

    if (paymentMethod === 'CASH' && cashReceivedNum > 0 && cashReceivedNum < total) {
      showToast('El efectivo recibido es insuficiente', 'error');
      return;
    }

    setProcessing(true);
    try {
      const { data } = await apiClient.post('/pos/sales', {
        items: cart.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        clientNit: clientNit.trim() || undefined,
        clientName: clientName.trim() || undefined,
        clientAddress: clientAddress.trim() || undefined,
        clientPhone: clientPhone.trim() || undefined,
        paymentMethod,
        cashReceived: paymentMethod === 'CASH' ? cashReceivedNum || undefined : undefined,
        discount: discount > 0 ? discount : undefined,
        notes: notes.trim() || undefined,
      });

      setCompletedSale(data);
      showToast(`Venta ${data.saleNumber} registrada`);
      loadSummary();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Error al procesar la venta', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // New sale (reset)
  const newSale = () => {
    setCart([]);
    setDiscount(0);
    setClientNit('');
    setClientName('');
    setClientAddress('');
    setClientPhone('');
    setPaymentMethod('CASH');
    setCashReceived('');
    setNotes('');
    setCompletedSale(null);
    searchRef.current?.focus();
  };

  // Print receipt
  const printReceipt = () => {
    if (!completedSale) return;
    const sale = completedSale;

    const receiptHtml = `
      <html>
      <head>
        <title>Recibo ${sale.saleNumber}</title>
        <style>
          @page { margin: 0; size: 80mm auto; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; padding: 4mm; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-top: 1px dashed #000; margin: 4px 0; }
          .row { display: flex; justify-content: space-between; }
          .items { width: 100%; }
          .item-name { font-size: 11px; }
          .item-detail { font-size: 10px; color: #333; display: flex; justify-content: space-between; }
          .total-row { font-size: 14px; font-weight: bold; }
          .footer { font-size: 10px; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size:14px;">FARMA MADYSON</div>
        <div class="center" style="font-size:10px;">4 Av 2-70 Zona 2, Chimaltenango</div>
        <div class="center" style="font-size:10px;">Tel: farmamadyson@gmail.com</div>
        <div class="line"></div>
        <div class="row"><span>No:</span><span class="bold">${sale.saleNumber}</span></div>
        <div class="row"><span>Fecha:</span><span>${new Date(sale.createdAt).toLocaleString('es-GT')}</span></div>
        <div class="row"><span>NIT:</span><span>${sale.clientNit}</span></div>
        <div class="row"><span>Cliente:</span><span>${sale.clientName}</span></div>
        <div class="row"><span>Cajero:</span><span>${sale.seller.firstName} ${sale.seller.lastName}</span></div>
        <div class="line"></div>
        <div class="items">
          ${sale.items
            .map(
              (item) => `
            <div class="item-name">${item.name}</div>
            <div class="item-detail">
              <span>${item.quantity} x Q${Number(item.price).toFixed(2)}</span>
              <span>Q${Number(item.subtotal).toFixed(2)}</span>
            </div>`
            )
            .join('')}
        </div>
        <div class="line"></div>
        <div class="row"><span>Subtotal:</span><span>Q${Number(sale.subtotal).toFixed(2)}</span></div>
        ${Number(sale.discount) > 0 ? `<div class="row"><span>Descuento:</span><span>-Q${Number(sale.discount).toFixed(2)}</span></div>` : ''}
        <div class="row total-row"><span>TOTAL:</span><span>Q${Number(sale.total).toFixed(2)}</span></div>
        <div class="line"></div>
        <div class="row"><span>Forma de pago:</span><span>${sale.paymentMethod === 'CASH' ? 'Efectivo' : sale.paymentMethod === 'CARD' ? 'Tarjeta' : 'Transferencia'}</span></div>
        ${sale.cashReceived ? `<div class="row"><span>Recibido:</span><span>Q${Number(sale.cashReceived).toFixed(2)}</span></div>` : ''}
        ${sale.change ? `<div class="row bold"><span>Cambio:</span><span>Q${Number(sale.change).toFixed(2)}</span></div>` : ''}
        <div class="line"></div>
        <div class="center footer">¡Gracias por su compra!</div>
        <div class="center footer">Farma Madyson — Donde Comienza el Bienestar</div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=350,height=600');
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
    }
  };

  // ---- RECEIPT VIEW ----
  if (completedSale) {
    const sale = completedSale;
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto text-xl">✓</div>
            <h2 className="text-xl font-bold text-foreground">Venta Registrada</h2>
            <p className="text-sm text-muted-foreground">{sale.saleNumber}</p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Cliente:</span><span>{sale.clientName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">NIT:</span><span>{sale.clientNit}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Fecha:</span><span>{new Date(sale.createdAt).toLocaleString('es-GT')}</span></div>
          </div>

          <div className="border-t border-border pt-3 space-y-2">
            {sale.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.name}</span>
                <span className="font-medium">Q{Number(item.subtotal).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span><span>Q{Number(sale.subtotal).toFixed(2)}</span>
            </div>
            {Number(sale.discount) > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Descuento:</span><span>-Q{Number(sale.discount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold">
              <span>TOTAL:</span><span>Q{Number(sale.total).toFixed(2)}</span>
            </div>
            {sale.cashReceived && (
              <>
                <div className="flex justify-between text-sm">
                  <span>Recibido:</span><span>Q{Number(sale.cashReceived).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-green-600">
                  <span>Cambio:</span><span>Q{Number(sale.change).toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={printReceipt}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-border rounded-lg hover:bg-muted transition-colors text-sm font-medium"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button
              onClick={newSale}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              Nueva Venta
            </button>
          </div>
        </div>

        {toastMsg && (
          <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-white text-sm z-50 ${
            toastMsg.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {toastMsg.message}
          </div>
        )}
      </div>
    );
  }

  // ---- MAIN POS VIEW ----
  return (
    <div className="flex gap-4 h-[calc(100vh-7rem)]">
      {/* LEFT: Product search + cart */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Summary bar */}
        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-2xl font-bold text-foreground">Punto de Venta</h1>
          <div className="ml-auto flex gap-4 text-sm">
            <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full font-medium">
              Hoy: {todaySummary.salesCount} ventas
            </div>
            <div className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full font-medium">
              Q{todaySummary.totalSales.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Product search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Buscar producto por nombre, SKU o código de barras..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchResults([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}

          {/* Search results dropdown */}
          {searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
              {searching ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Buscando...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">No se encontraron productos</div>
              ) : (
                searchResults.map((product) =>
                  product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => addToCart(product, variant)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border last:border-b-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{variant.name} — SKU: {variant.sku}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-primary">Q{Number(variant.salePrice).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Stock: {variant.stock}</p>
                      </div>
                      <Plus className="w-5 h-5 text-primary flex-shrink-0" />
                    </button>
                  ))
                )
              )}
            </div>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 bg-white rounded-xl border border-border overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center">
            <span className="text-sm font-medium text-foreground">Productos ({cart.length})</span>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="ml-auto text-xs text-red-500 hover:text-red-700"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Search className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">Busque y agregue productos</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {cart.map((item) => (
                  <div key={item.variantId} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">{item.variantName} — {item.sku}</p>
                      <p className="text-xs text-primary font-medium">Q{item.price.toFixed(2)} c/u</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.variantId, -1)}
                        className="p-1 rounded hover:bg-muted transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.variantId, 1)}
                        className="p-1 rounded hover:bg-muted transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <span className="text-sm font-bold w-20 text-right">
                      Q{(item.price * item.quantity).toFixed(2)}
                    </span>

                    <button
                      onClick={() => removeItem(item.variantId)}
                      className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Client + Payment */}
      <div className="w-80 flex flex-col gap-4 flex-shrink-0">
        {/* Client */}
        <div className="bg-white rounded-xl border border-border p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <UserSearch className="w-4 h-4" />
            Cliente
          </h3>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">NIT</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={clientNit}
                onChange={(e) => setClientNit(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNitSearch()}
                placeholder="CF"
                className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <button
                onClick={handleNitSearch}
                disabled={searchingClient}
                className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {searchingClient ? '...' : 'Buscar'}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Nombre</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Consumidor Final"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {/* Payment method */}
        <div className="bg-white rounded-xl border border-border p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Forma de Pago</h3>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'CASH' as const, label: 'Efectivo', icon: DollarSign },
              { value: 'CARD' as const, label: 'Tarjeta', icon: CreditCard },
              { value: 'TRANSFER' as const, label: 'Transfer.', icon: ArrowRightLeft },
            ]).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setPaymentMethod(value)}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                  paymentMethod === value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/30'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {paymentMethod === 'CASH' && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Efectivo Recibido</label>
              <input
                type="number"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Descuento (Q)</label>
            <input
              type="number"
              value={discount || ''}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Notas</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {/* Totals + Charge */}
        <div className="bg-white rounded-xl border border-border p-4 space-y-3 mt-auto">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>Q{subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Descuento:</span>
                <span>-Q{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
              <span>TOTAL:</span>
              <span>Q{total.toFixed(2)}</span>
            </div>
            {paymentMethod === 'CASH' && cashReceivedNum > 0 && (
              <div className={`flex justify-between font-bold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <span>Cambio:</span>
                <span>Q{change.toFixed(2)}</span>
              </div>
            )}
          </div>

          <button
            onClick={processSale}
            disabled={processing || cart.length === 0}
            className="w-full py-3 bg-primary text-white rounded-lg font-bold text-base hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {processing ? 'Procesando...' : `Cobrar Q${total.toFixed(2)}`}
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-white text-sm z-50 ${
          toastMsg.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toastMsg.message}
        </div>
      )}
    </div>
  );
}
