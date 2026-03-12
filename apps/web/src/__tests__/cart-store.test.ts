import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '@/stores/cart-store';

describe('Cart Store', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  it('should start with empty cart', () => {
    const state = useCartStore.getState();
    expect(state.items).toEqual([]);
    expect(state.itemCount()).toBe(0);
  });

  it('should add item to cart', () => {
    useCartStore.getState().addItem('v-1', 2);
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toEqual({ variantId: 'v-1', quantity: 2 });
  });

  it('should increment quantity for existing item', () => {
    useCartStore.getState().addItem('v-1', 1);
    useCartStore.getState().addItem('v-1', 3);
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(4);
  });

  it('should store ONLY variantId and quantity — NEVER prices', () => {
    useCartStore.getState().addItem('v-1', 1);
    const item = useCartStore.getState().items[0];
    const keys = Object.keys(item);
    expect(keys).toEqual(['variantId', 'quantity']);
    expect(keys).not.toContain('price');
    expect(keys).not.toContain('salePrice');
    expect(keys).not.toContain('unitPrice');
  });

  it('should remove item from cart', () => {
    useCartStore.getState().addItem('v-1', 1);
    useCartStore.getState().addItem('v-2', 3);
    useCartStore.getState().removeItem('v-1');

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].variantId).toBe('v-2');
  });

  it('should update quantity', () => {
    useCartStore.getState().addItem('v-1', 1);
    useCartStore.getState().updateQuantity('v-1', 5);
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it('should remove item when quantity updated to 0', () => {
    useCartStore.getState().addItem('v-1', 1);
    useCartStore.getState().updateQuantity('v-1', 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('should clear entire cart', () => {
    useCartStore.getState().addItem('v-1', 1);
    useCartStore.getState().addItem('v-2', 2);
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('should count total items correctly', () => {
    useCartStore.getState().addItem('v-1', 3);
    useCartStore.getState().addItem('v-2', 2);
    expect(useCartStore.getState().itemCount()).toBe(5);
  });
});
