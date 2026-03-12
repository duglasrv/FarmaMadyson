import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ============================================================
  // 1. ROLES
  // ============================================================
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'super_admin' },
      update: {},
      create: { name: 'super_admin', displayName: 'Super Administrador', description: 'Acceso total al sistema', isSystem: true },
    }),
    prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: { name: 'admin', displayName: 'Administrador', description: 'Todo excepto gestión de roles y permisos del sistema', isSystem: true },
    }),
    prisma.role.upsert({
      where: { name: 'pharmacist' },
      update: {},
      create: { name: 'pharmacist', displayName: 'Farmacéutico', description: 'Productos, inventario, recetas, pedidos', isSystem: true },
    }),
    prisma.role.upsert({
      where: { name: 'warehouse' },
      update: {},
      create: { name: 'warehouse', displayName: 'Bodega', description: 'Inventario, recepción, stock', isSystem: true },
    }),
    prisma.role.upsert({
      where: { name: 'sales' },
      update: {},
      create: { name: 'sales', displayName: 'Ventas', description: 'Pedidos, clientes (solo lectura de inventario)', isSystem: true },
    }),
    prisma.role.upsert({
      where: { name: 'customer' },
      update: {},
      create: { name: 'customer', displayName: 'Cliente', description: 'Rol por defecto para clientes web', isSystem: true, isDefault: true },
    }),
  ]);

  const [superAdminRole, adminRole, pharmacistRole, warehouseRole, salesRole, customerRole] = roles;
  console.log(`✅ ${roles.length} roles created`);

  // ============================================================
  // 2. PERMISSIONS
  // ============================================================
  const permissionDefs = [
    // Products
    { resource: 'product', action: 'create', description: 'Crear productos' },
    { resource: 'product', action: 'read', description: 'Ver productos' },
    { resource: 'product', action: 'update', description: 'Actualizar productos' },
    { resource: 'product', action: 'delete', description: 'Eliminar productos' },
    { resource: 'product', action: 'manage_prices', description: 'Gestionar precios' },
    // Categories
    { resource: 'category', action: 'create', description: 'Crear categorías' },
    { resource: 'category', action: 'read', description: 'Ver categorías' },
    { resource: 'category', action: 'update', description: 'Actualizar categorías' },
    { resource: 'category', action: 'delete', description: 'Eliminar categorías' },
    // Inventory
    { resource: 'inventory', action: 'read', description: 'Ver inventario' },
    { resource: 'inventory', action: 'receive_stock', description: 'Recibir mercadería' },
    { resource: 'inventory', action: 'adjust', description: 'Ajustar inventario' },
    { resource: 'inventory', action: 'transfer', description: 'Transferir inventario' },
    { resource: 'inventory', action: 'view_movements', description: 'Ver movimientos' },
    { resource: 'inventory', action: 'export', description: 'Exportar inventario' },
    // Orders
    { resource: 'order', action: 'read', description: 'Ver todos los pedidos' },
    { resource: 'order', action: 'read_own', description: 'Ver pedidos propios' },
    { resource: 'order', action: 'update_status', description: 'Cambiar estado de pedidos' },
    { resource: 'order', action: 'cancel', description: 'Cancelar pedidos' },
    { resource: 'order', action: 'process_payment', description: 'Procesar pagos' },
    // Users
    { resource: 'user', action: 'create', description: 'Crear usuarios' },
    { resource: 'user', action: 'read', description: 'Ver usuarios' },
    { resource: 'user', action: 'update', description: 'Actualizar usuarios' },
    { resource: 'user', action: 'delete', description: 'Eliminar usuarios' },
    { resource: 'user', action: 'assign_roles', description: 'Asignar roles' },
    { resource: 'user', action: 'view_activity', description: 'Ver actividad de usuarios' },
    // Prescriptions
    { resource: 'prescription', action: 'upload_own', description: 'Subir receta propia' },
    { resource: 'prescription', action: 'review', description: 'Revisar recetas' },
    { resource: 'prescription', action: 'approve', description: 'Aprobar recetas' },
    { resource: 'prescription', action: 'reject', description: 'Rechazar recetas' },
    { resource: 'prescription', action: 'view_all', description: 'Ver todas las recetas' },
    // Promotions
    { resource: 'promotion', action: 'create', description: 'Crear promociones' },
    { resource: 'promotion', action: 'read', description: 'Ver promociones' },
    { resource: 'promotion', action: 'update', description: 'Actualizar promociones' },
    { resource: 'promotion', action: 'delete', description: 'Eliminar promociones' },
    { resource: 'promotion', action: 'manage_coupons', description: 'Gestionar cupones' },
    // Banners
    { resource: 'banner', action: 'create', description: 'Crear banners' },
    { resource: 'banner', action: 'read', description: 'Ver banners' },
    { resource: 'banner', action: 'update', description: 'Actualizar banners' },
    { resource: 'banner', action: 'delete', description: 'Eliminar banners' },
    // Reports
    { resource: 'report', action: 'view_sales', description: 'Ver reportes de ventas' },
    { resource: 'report', action: 'view_inventory', description: 'Ver reportes de inventario' },
    { resource: 'report', action: 'view_financial', description: 'Ver reportes financieros' },
    { resource: 'report', action: 'export_data', description: 'Exportar datos' },
    // Settings
    { resource: 'settings', action: 'read', description: 'Ver configuración' },
    { resource: 'settings', action: 'update_general', description: 'Actualizar configuración general' },
    { resource: 'settings', action: 'manage_roles', description: 'Gestionar roles' },
    { resource: 'settings', action: 'manage_permissions', description: 'Gestionar permisos' },
    { resource: 'settings', action: 'manage_pages', description: 'Gestionar páginas' },
    // Suppliers
    { resource: 'supplier', action: 'create', description: 'Crear proveedores' },
    { resource: 'supplier', action: 'read', description: 'Ver proveedores' },
    { resource: 'supplier', action: 'update', description: 'Actualizar proveedores' },
    { resource: 'supplier', action: 'delete', description: 'Eliminar proveedores' },
    // Purchase Orders
    { resource: 'purchase_order', action: 'create', description: 'Crear órdenes de compra' },
    { resource: 'purchase_order', action: 'read', description: 'Ver órdenes de compra' },
    { resource: 'purchase_order', action: 'update', description: 'Actualizar órdenes de compra' },
    { resource: 'purchase_order', action: 'receive', description: 'Recibir órdenes de compra' },
  ];

  const permissions = await Promise.all(
    permissionDefs.map((p) =>
      prisma.permission.upsert({
        where: { resource_action: { resource: p.resource, action: p.action } },
        update: {},
        create: p,
      }),
    ),
  );
  console.log(`✅ ${permissions.length} permissions created`);

  // ============================================================
  // 3. ROLE-PERMISSION ASSIGNMENTS
  // ============================================================
  const allPermissions = await prisma.permission.findMany();
  const permMap = new Map(allPermissions.map((p) => [`${p.resource}:${p.action}`, p.id]));

  const getId = (key: string) => {
    const id = permMap.get(key);
    if (!id) throw new Error(`Permission not found: ${key}`);
    return id;
  };

  // Super Admin: ALL
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: perm.id },
    });
  }

  // Admin: all EXCEPT manage_roles, manage_permissions
  const adminExclude = ['settings:manage_roles', 'settings:manage_permissions'];
  for (const perm of allPermissions) {
    if (adminExclude.includes(`${perm.resource}:${perm.action}`)) continue;
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  // Pharmacist
  const pharmacistPerms = [
    'product:create', 'product:read', 'product:update', 'product:manage_prices',
    'category:read',
    'inventory:read', 'inventory:receive_stock', 'inventory:adjust', 'inventory:view_movements',
    'order:read', 'order:update_status', 'order:process_payment',
    'prescription:review', 'prescription:approve', 'prescription:reject', 'prescription:view_all',
    'report:view_sales', 'report:view_inventory',
    'supplier:read',
    'purchase_order:read',
  ];
  for (const key of pharmacistPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: pharmacistRole.id, permissionId: getId(key) } },
      update: {},
      create: { roleId: pharmacistRole.id, permissionId: getId(key) },
    });
  }

  // Warehouse
  const warehousePerms = [
    'product:read',
    'category:read',
    'inventory:read', 'inventory:receive_stock', 'inventory:adjust', 'inventory:transfer', 'inventory:view_movements', 'inventory:export',
    'supplier:read',
    'purchase_order:read', 'purchase_order:receive',
    'report:view_inventory',
  ];
  for (const key of warehousePerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: warehouseRole.id, permissionId: getId(key) } },
      update: {},
      create: { roleId: warehouseRole.id, permissionId: getId(key) },
    });
  }

  // Sales
  const salesPerms = [
    'product:read',
    'category:read',
    'inventory:read',
    'order:read', 'order:update_status', 'order:cancel', 'order:process_payment',
    'user:read',
    'promotion:read',
    'report:view_sales',
  ];
  for (const key of salesPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: salesRole.id, permissionId: getId(key) } },
      update: {},
      create: { roleId: salesRole.id, permissionId: getId(key) },
    });
  }

  // Customer
  const customerPerms = ['order:read_own', 'prescription:upload_own'];
  for (const key of customerPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: customerRole.id, permissionId: getId(key) } },
      update: {},
      create: { roleId: customerRole.id, permissionId: getId(key) },
    });
  }

  console.log('✅ Role-permission assignments done');

  // ============================================================
  // 4. SUPER ADMIN USER
  // ============================================================
  const passwordHash = await bcrypt.hash('FarmaMadyson2026!', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@farmamadyson.com' },
    update: {},
    create: {
      email: 'admin@farmamadyson.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Farma Madyson',
      isActive: true,
      isVerified: true,
      emailVerifiedAt: new Date(),
      twoFactorEnabled: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: superAdmin.id, roleId: superAdminRole.id } },
    update: {},
    create: { userId: superAdmin.id, roleId: superAdminRole.id },
  });
  console.log('✅ Super admin user created: admin@farmamadyson.com');

  // ============================================================
  // 5. SUPPLIER — SOLUFARMA
  // ============================================================
  const solufarma = await prisma.supplier.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'SOLUCIONES FARMACEUTICAS S.A.',
      contactName: 'Solufarma',
      email: 'info@solufarma.com.gt',
      address: 'Avenida los Aposentos Zona 0, Chimaltenango',
      paymentTerms: 'Contado',
      isActive: true,
    },
  });
  console.log('✅ Supplier Solufarma created');

  // ============================================================
  // 6. CATEGORIES
  // ============================================================
  const medicamentos = await prisma.category.upsert({
    where: { slug: 'medicamentos' },
    update: {},
    create: { name: 'Medicamentos', slug: 'medicamentos', sortOrder: 1 },
  });

  const catChildren = [
    { name: 'Antibióticos', slug: 'antibioticos', parentId: medicamentos.id, sortOrder: 1 },
    { name: 'Analgésicos', slug: 'analgesicos', parentId: medicamentos.id, sortOrder: 2 },
    { name: 'Antigripales', slug: 'antigripales', parentId: medicamentos.id, sortOrder: 3 },
    { name: 'Antialérgicos', slug: 'antialergicos', parentId: medicamentos.id, sortOrder: 4 },
    { name: 'Gastrointestinal', slug: 'gastrointestinal', parentId: medicamentos.id, sortOrder: 5 },
    { name: 'Pediátricos', slug: 'pediatricos', parentId: medicamentos.id, sortOrder: 6 },
  ];

  for (const cat of catChildren) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  const nutricion = await prisma.category.upsert({
    where: { slug: 'nutricion' },
    update: {},
    create: { name: 'Nutrición', slug: 'nutricion', sortOrder: 2 },
  });

  const nutriChildren = [
    { name: 'Fórmulas Infantiles', slug: 'formulas-infantiles', parentId: nutricion.id, sortOrder: 1 },
    { name: 'Suplementos Adulto', slug: 'suplementos-adulto', parentId: nutricion.id, sortOrder: 2 },
    { name: 'Vitaminas', slug: 'vitaminas', parentId: nutricion.id, sortOrder: 3 },
  ];

  for (const cat of nutriChildren) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  await prisma.category.upsert({
    where: { slug: 'cuidado-personal' },
    update: {},
    create: { name: 'Cuidado Personal', slug: 'cuidado-personal', sortOrder: 3 },
  });

  await prisma.category.upsert({
    where: { slug: 'dispositivos-medicos' },
    update: {},
    create: { name: 'Dispositivos Médicos', slug: 'dispositivos-medicos', sortOrder: 4 },
  });

  console.log('✅ Categories created');

  // ============================================================
  // 7. BRANDS (Laboratorios reales)
  // ============================================================
  const brandNames = [
    'ABBOTT', 'INFASA', 'SELECT', 'CAPLIN', 'BAYER', 'PFIZER', 'ROCHE',
    'SANOFI', 'NOVARTIS', 'ASTRAZENECA', 'GSK', 'MERCK', 'JANSSEN',
    'BOEHRINGER', 'LILLY', 'TAKEDA', 'AMGEN', 'GILEAD', 'BIOGEN',
    'DONALDO', 'UNIPHARM', 'LANCASCO', 'PHARMALAT', 'QUIMICA Y FARMACIA',
    'LAPRIN', 'COFARMA', 'MENARINI', 'MEGALABS', 'EUROFARMA', 'TECNOFARMA',
    'STEIN', 'LETERAGO', 'GENFAR', 'MK', 'LABQUIFAR', 'GUTIS',
    'CEGUEL', 'VIJOSA', 'AFI', 'LAFARE', 'GINOPHARM', 'ARSAL',
    'MED PHARMA', 'GRUPO FARMA', 'ROEMMERS', 'OPIC', 'SAVAL', 'MEDIFARMA',
    'SOPHIA', 'ULTRA', 'MAVER', 'PROTEA', 'NATUREX', 'DROGAM',
  ];

  const slugify = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  for (const name of brandNames) {
    await prisma.brand.upsert({
      where: { name },
      update: {},
      create: { name, slug: slugify(name) },
    });
  }
  console.log(`✅ ${brandNames.length} brands created`);

  // ============================================================
  // 8. SAMPLE PRODUCTS (20 real products with variants & batches)
  // ============================================================
  const abbottBrand = await prisma.brand.findUnique({ where: { name: 'ABBOTT' } });
  const infasaBrand = await prisma.brand.findUnique({ where: { name: 'INFASA' } });
  const bayerBrand = await prisma.brand.findUnique({ where: { name: 'BAYER' } });
  const selectBrand = await prisma.brand.findUnique({ where: { name: 'SELECT' } });
  const caplinBrand = await prisma.brand.findUnique({ where: { name: 'CAPLIN' } });

  const analgesicos = await prisma.category.findUnique({ where: { slug: 'analgesicos' } });
  const antibioticos = await prisma.category.findUnique({ where: { slug: 'antibioticos' } });
  const antigripales = await prisma.category.findUnique({ where: { slug: 'antigripales' } });
  const antialergicos = await prisma.category.findUnique({ where: { slug: 'antialergicos' } });
  const gastrointestinal = await prisma.category.findUnique({ where: { slug: 'gastrointestinal' } });
  const pediatricos = await prisma.category.findUnique({ where: { slug: 'pediatricos' } });
  const vitaminas = await prisma.category.findUnique({ where: { slug: 'vitaminas' } });

  interface SampleProduct {
    name: string;
    slug: string;
    shortDescription: string;
    categoryId: string;
    brandId: string;
    images: string[];
    variant: {
      name: string;
      sku: string;
      supplierCode: string;
      purchasePrice: number;
      suggestedPrice: number;
      salePrice: number;
      compareAtPrice?: number;
      taxExempt: boolean;
      unitsPerBox: number;
    };
    pharma: {
      activeIngredient: string;
      concentration: string;
      dosageForm: string;
      administrationRoute: string;
      requiresPrescription: boolean;
    };
    batchQty: number;
    batchExpiry: Date;
  }

  const sampleProducts: SampleProduct[] = [
    {
      name: 'PARACETAMOL 500MG TABLETAS',
      slug: 'paracetamol-500mg-tabletas',
      shortDescription: 'Analgésico y antipirético para el alivio del dolor y la fiebre',
      categoryId: analgesicos!.id,
      brandId: infasaBrand!.id,
      images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop'],
      variant: { name: 'Caja x 100', sku: 'FM-00001', supplierCode: 'PF-41979', purchasePrice: 18.50, suggestedPrice: 28.00, salePrice: 25.00, compareAtPrice: 30.00, taxExempt: true, unitsPerBox: 100 },
      pharma: { activeIngredient: 'Paracetamol (Acetaminofén)', concentration: '500mg', dosageForm: 'Tableta', administrationRoute: 'Oral', requiresPrescription: false },
      batchQty: 50, batchExpiry: new Date('2027-06-01'),
    },
    {
      name: 'IBUPROFENO 400MG TABLETAS',
      slug: 'ibuprofeno-400mg-tabletas',
      shortDescription: 'Antiinflamatorio no esteroideo para dolor e inflamación',
      categoryId: analgesicos!.id,
      brandId: infasaBrand!.id,
      images: ['https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=400&h=400&fit=crop'],
      variant: { name: 'Caja x 50', sku: 'FM-00002', supplierCode: 'PF-41980', purchasePrice: 25.00, suggestedPrice: 38.00, salePrice: 35.00, compareAtPrice: 40.00, taxExempt: true, unitsPerBox: 50 },
      pharma: { activeIngredient: 'Ibuprofeno', concentration: '400mg', dosageForm: 'Tableta', administrationRoute: 'Oral', requiresPrescription: false },
      batchQty: 30, batchExpiry: new Date('2027-08-01'),
    },
    {
      name: 'AMOXICILINA 500MG CÁPSULAS',
      slug: 'amoxicilina-500mg-capsulas',
      shortDescription: 'Antibiótico de amplio espectro para infecciones bacterianas',
      categoryId: antibioticos!.id,
      brandId: caplinBrand!.id,
      images: ['https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop'],
      variant: { name: 'Caja x 21', sku: 'FM-00003', supplierCode: 'PF-42001', purchasePrice: 15.00, suggestedPrice: 22.00, salePrice: 22.00, taxExempt: true, unitsPerBox: 21 },
      pharma: { activeIngredient: 'Amoxicilina', concentration: '500mg', dosageForm: 'Cápsula', administrationRoute: 'Oral', requiresPrescription: true },
      batchQty: 40, batchExpiry: new Date('2027-04-01'),
    },
    {
      name: 'AZITROMICINA 500MG TABLETAS',
      slug: 'azitromicina-500mg-tabletas',
      shortDescription: 'Antibiótico macrólido de acción prolongada',
      categoryId: antibioticos!.id,
      brandId: selectBrand!.id,
      images: ['https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&h=400&fit=crop'],
      variant: { name: 'Caja x 3', sku: 'FM-00004', supplierCode: 'PF-42010', purchasePrice: 12.00, suggestedPrice: 18.00, salePrice: 18.00, taxExempt: true, unitsPerBox: 3 },
      pharma: { activeIngredient: 'Azitromicina', concentration: '500mg', dosageForm: 'Tableta', administrationRoute: 'Oral', requiresPrescription: true },
      batchQty: 25, batchExpiry: new Date('2027-05-01'),
    },
    {
      name: 'LORATADINA 10MG TABLETAS',
      slug: 'loratadina-10mg-tabletas',
      shortDescription: 'Antihistamínico no sedante para alergias',
      categoryId: antialergicos!.id,
      brandId: infasaBrand!.id,
      images: ['https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop'],
      variant: { name: 'Caja x 10', sku: 'FM-00005', supplierCode: 'PF-42020', purchasePrice: 5.50, suggestedPrice: 8.00, salePrice: 8.00, compareAtPrice: 10.00, taxExempt: true, unitsPerBox: 10 },
      pharma: { activeIngredient: 'Loratadina', concentration: '10mg', dosageForm: 'Tableta', administrationRoute: 'Oral', requiresPrescription: false },
      batchQty: 60, batchExpiry: new Date('2027-10-01'),
    },
    {
      name: 'OMEPRAZOL 20MG CÁPSULAS',
      slug: 'omeprazol-20mg-capsulas',
      shortDescription: 'Inhibidor de bomba de protones para acidez gástrica',
      categoryId: gastrointestinal!.id,
      brandId: caplinBrand!.id,
      images: ['https://images.unsplash.com/photo-1576602976047-174e57a47881?w=400&h=400&fit=crop'],
      variant: { name: 'Caja x 14', sku: 'FM-00006', supplierCode: 'PF-42030', purchasePrice: 8.00, suggestedPrice: 12.00, salePrice: 12.00, compareAtPrice: 15.00, taxExempt: true, unitsPerBox: 14 },
      pharma: { activeIngredient: 'Omeprazol', concentration: '20mg', dosageForm: 'Cápsula', administrationRoute: 'Oral', requiresPrescription: false },
      batchQty: 45, batchExpiry: new Date('2027-07-01'),
    },
    {
      name: 'METFORMINA 850MG TABLETAS',
      slug: 'metformina-850mg-tabletas',
      shortDescription: 'Antidiabético oral para control de glucosa',
      categoryId: medicamentos.id,
      brandId: infasaBrand!.id,
      images: ['https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400&h=400&fit=crop'],
      variant: { name: 'Caja x 30', sku: 'FM-00007', supplierCode: 'PF-42040', purchasePrice: 12.00, suggestedPrice: 18.00, salePrice: 18.00, taxExempt: true, unitsPerBox: 30 },
      pharma: { activeIngredient: 'Metformina HCl', concentration: '850mg', dosageForm: 'Tableta', administrationRoute: 'Oral', requiresPrescription: true },
      batchQty: 35, batchExpiry: new Date('2027-09-01'),
    },
    {
      name: 'LOSARTAN 50MG TABLETAS',
      slug: 'losartan-50mg-tabletas',
      shortDescription: 'Antihipertensivo para control de presión arterial',
      categoryId: medicamentos.id,
      brandId: selectBrand!.id,
      images: ['https://images.unsplash.com/photo-1559757175-7cb057fba93c?w=400&h=400&fit=crop'],
      variant: { name: 'Caja x 30', sku: 'FM-00008', supplierCode: 'PF-42050', purchasePrice: 14.00, suggestedPrice: 22.00, salePrice: 22.00, taxExempt: true, unitsPerBox: 30 },
      pharma: { activeIngredient: 'Losartán Potásico', concentration: '50mg', dosageForm: 'Tableta', administrationRoute: 'Oral', requiresPrescription: true },
      batchQty: 20, batchExpiry: new Date('2027-11-01'),
    },
    {
      name: 'ATORVASTATINA 20MG TABLETAS',
      slug: 'atorvastatina-20mg-tabletas',
      shortDescription: 'Reductor de colesterol de alta eficacia',
      categoryId: medicamentos.id,
      brandId: abbottBrand!.id,
      images: ['https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400&h=400&fit=crop'],
      variant: { name: 'Caja x 10', sku: 'FM-00009', supplierCode: 'PF-42060', purchasePrice: 20.00, suggestedPrice: 30.00, salePrice: 28.00, compareAtPrice: 35.00, taxExempt: true, unitsPerBox: 10 },
      pharma: { activeIngredient: 'Atorvastatina Cálcica', concentration: '20mg', dosageForm: 'Tableta', administrationRoute: 'Oral', requiresPrescription: true },
      batchQty: 15, batchExpiry: new Date('2027-05-01'),
    },
    {
      name: 'ANTIGRIPAL FORTE CÁPSULAS',
      slug: 'antigripal-forte-capsulas',
      shortDescription: 'Alivio rápido de síntomas gripales y resfriado',
      categoryId: antigripales!.id,
      brandId: infasaBrand!.id,
      images: ['https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&h=400&fit=crop'],
      variant: { name: 'Caja x 12', sku: 'FM-00010', supplierCode: 'PF-42070', purchasePrice: 10.00, suggestedPrice: 15.00, salePrice: 15.00, taxExempt: true, unitsPerBox: 12 },
      pharma: { activeIngredient: 'Paracetamol + Fenilefrina + Clorfeniramina', concentration: '500mg/5mg/2mg', dosageForm: 'Cápsula', administrationRoute: 'Oral', requiresPrescription: false },
      batchQty: 55, batchExpiry: new Date('2027-03-01'),
    },
    {
      name: 'AMOXICILINA SUSPENSIÓN PEDIÁTRICA',
      slug: 'amoxicilina-suspension-pediatrica',
      shortDescription: 'Antibiótico en suspensión para niños',
      categoryId: pediatricos!.id,
      brandId: caplinBrand!.id,
      images: ['https://images.unsplash.com/photo-1626285861696-9f0bf5a49c6d?w=400&h=400&fit=crop'],
      variant: { name: 'Frasco 60ml', sku: 'FM-00011', supplierCode: 'PF-42080', purchasePrice: 18.00, suggestedPrice: 28.00, salePrice: 28.00, taxExempt: true, unitsPerBox: 1 },
      pharma: { activeIngredient: 'Amoxicilina', concentration: '250mg/5ml', dosageForm: 'Suspensión', administrationRoute: 'Oral', requiresPrescription: true },
      batchQty: 20, batchExpiry: new Date('2027-02-01'),
    },
    {
      name: 'CETIRIZINA JARABE PEDIÁTRICO',
      slug: 'cetirizina-jarabe-pediatrico',
      shortDescription: 'Antialérgico en jarabe para niños',
      categoryId: pediatricos!.id,
      brandId: infasaBrand!.id,
      images: ['https://images.unsplash.com/photo-1603807008857-ad66b70431aa?w=400&h=400&fit=crop'],
      variant: { name: 'Frasco 60ml', sku: 'FM-00012', supplierCode: 'PF-42090', purchasePrice: 12.00, suggestedPrice: 20.00, salePrice: 18.00, compareAtPrice: 22.00, taxExempt: true, unitsPerBox: 1 },
      pharma: { activeIngredient: 'Cetirizina', concentration: '5mg/5ml', dosageForm: 'Jarabe', administrationRoute: 'Oral', requiresPrescription: false },
      batchQty: 25, batchExpiry: new Date('2027-06-01'),
    },
    {
      name: 'MULTIVITAMÍNICO ADULTO TABLETAS',
      slug: 'multivitaminico-adulto-tabletas',
      shortDescription: 'Suplemento vitamínico y mineral completo',
      categoryId: vitaminas!.id,
      brandId: bayerBrand!.id,
      images: ['https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop'],
      variant: { name: 'Frasco x 30', sku: 'FM-00013', supplierCode: 'PF-42100', purchasePrice: 35.00, suggestedPrice: 55.00, salePrice: 55.00, compareAtPrice: 60.00, taxExempt: false, unitsPerBox: 30 },
      pharma: { activeIngredient: 'Vitaminas A, B, C, D, E + Minerales', concentration: 'Complejo', dosageForm: 'Tableta', administrationRoute: 'Oral', requiresPrescription: false },
      batchQty: 40, batchExpiry: new Date('2028-01-01'),
    },
    {
      name: 'VITAMINA C 1000MG EFERVESCENTE',
      slug: 'vitamina-c-1000mg-efervescente',
      shortDescription: 'Vitamina C de alta potencia para el sistema inmune',
      categoryId: vitaminas!.id,
      brandId: bayerBrand!.id,
      images: ['https://images.unsplash.com/photo-1616671276441-2f2c277b8bf6?w=400&h=400&fit=crop'],
      variant: { name: 'Tubo x 10', sku: 'FM-00014', supplierCode: 'PF-42110', purchasePrice: 22.00, suggestedPrice: 35.00, salePrice: 32.00, compareAtPrice: 38.00, taxExempt: false, unitsPerBox: 10 },
      pharma: { activeIngredient: 'Ácido Ascórbico', concentration: '1000mg', dosageForm: 'Tableta Efervescente', administrationRoute: 'Oral', requiresPrescription: false },
      batchQty: 30, batchExpiry: new Date('2027-12-01'),
    },
    {
      name: 'DICLOFENACO 75MG INYECTABLE',
      slug: 'diclofenaco-75mg-inyectable',
      shortDescription: 'Antiinflamatorio inyectable de acción rápida',
      categoryId: analgesicos!.id,
      brandId: infasaBrand!.id,
      images: ['https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400&h=400&fit=crop'],
      variant: { name: 'Caja x 3 ampollas', sku: 'FM-00015', supplierCode: 'PF-42120', purchasePrice: 8.00, suggestedPrice: 12.00, salePrice: 12.00, taxExempt: true, unitsPerBox: 3 },
      pharma: { activeIngredient: 'Diclofenaco Sódico', concentration: '75mg/3ml', dosageForm: 'Ampolla', administrationRoute: 'Intramuscular', requiresPrescription: true },
      batchQty: 20, batchExpiry: new Date('2027-08-01'),
    },
    {
      name: 'RANITIDINA 150MG TABLETAS',
      slug: 'ranitidina-150mg-tabletas',
      shortDescription: 'Antiácido para úlceras y reflujo gástrico',
      categoryId: gastrointestinal!.id,
      brandId: selectBrand!.id,
      images: ['https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop'],
      variant: { name: 'Caja x 20', sku: 'FM-00016', supplierCode: 'PF-42130', purchasePrice: 6.00, suggestedPrice: 10.00, salePrice: 10.00, taxExempt: true, unitsPerBox: 20 },
      pharma: { activeIngredient: 'Ranitidina', concentration: '150mg', dosageForm: 'Tableta', administrationRoute: 'Oral', requiresPrescription: false },
      batchQty: 35, batchExpiry: new Date('2027-04-01'),
    },
    {
      name: 'SALBUTAMOL INHALADOR',
      slug: 'salbutamol-inhalador',
      shortDescription: 'Broncodilatador para el asma y EPOC',
      categoryId: medicamentos.id,
      brandId: abbottBrand!.id,
      images: ['https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400&h=400&fit=crop'],
      variant: { name: 'Inhalador 200 dosis', sku: 'FM-00017', supplierCode: 'PF-42140', purchasePrice: 45.00, suggestedPrice: 70.00, salePrice: 65.00, compareAtPrice: 75.00, taxExempt: true, unitsPerBox: 1 },
      pharma: { activeIngredient: 'Salbutamol Sulfato', concentration: '100mcg/dosis', dosageForm: 'Inhalador', administrationRoute: 'Inhalatoria', requiresPrescription: true },
      batchQty: 10, batchExpiry: new Date('2027-07-01'),
    },
    {
      name: 'CLOTRIMAZOL CREMA 1%',
      slug: 'clotrimazol-crema-1',
      shortDescription: 'Antimicótico tópico para infecciones por hongos',
      categoryId: medicamentos.id,
      brandId: infasaBrand!.id,
      images: ['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop'],
      variant: { name: 'Tubo 20g', sku: 'FM-00018', supplierCode: 'PF-42150', purchasePrice: 10.00, suggestedPrice: 16.00, salePrice: 16.00, taxExempt: true, unitsPerBox: 1 },
      pharma: { activeIngredient: 'Clotrimazol', concentration: '1%', dosageForm: 'Crema', administrationRoute: 'Tópica', requiresPrescription: false },
      batchQty: 25, batchExpiry: new Date('2027-09-01'),
    },
    {
      name: 'ASPIRINA 100MG TABLETAS',
      slug: 'aspirina-100mg-tabletas',
      shortDescription: 'Antiagregante plaquetario y analgésico suave',
      categoryId: analgesicos!.id,
      brandId: bayerBrand!.id,
      images: ['https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=400&h=400&fit=crop'],
      variant: { name: 'Caja x 28', sku: 'FM-00019', supplierCode: 'PF-42160', purchasePrice: 18.00, suggestedPrice: 28.00, salePrice: 28.00, compareAtPrice: 32.00, taxExempt: true, unitsPerBox: 28 },
      pharma: { activeIngredient: 'Ácido Acetilsalicílico', concentration: '100mg', dosageForm: 'Tableta', administrationRoute: 'Oral', requiresPrescription: false },
      batchQty: 30, batchExpiry: new Date('2028-02-01'),
    },
    {
      name: 'COMPLEJO B INYECTABLE',
      slug: 'complejo-b-inyectable',
      shortDescription: 'Vitaminas del complejo B para energía y sistema nervioso',
      categoryId: vitaminas!.id,
      brandId: infasaBrand!.id,
      images: ['https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400&h=400&fit=crop'],
      variant: { name: 'Caja x 3 ampollas', sku: 'FM-00020', supplierCode: 'PF-42170', purchasePrice: 15.00, suggestedPrice: 24.00, salePrice: 24.00, taxExempt: true, unitsPerBox: 3 },
      pharma: { activeIngredient: 'Tiamina + Piridoxina + Cianocobalamina', concentration: 'B1 100mg + B6 100mg + B12 1000mcg', dosageForm: 'Ampolla', administrationRoute: 'Intramuscular', requiresPrescription: false },
      batchQty: 20, batchExpiry: new Date('2027-10-01'),
    },
  ];

  for (const sp of sampleProducts) {
    const product = await prisma.product.upsert({
      where: { slug: sp.slug },
      update: {},
      create: {
        name: sp.name,
        slug: sp.slug,
        shortDescription: sp.shortDescription,
        images: sp.images,
        productType: 'MEDICINE',
        categoryId: sp.categoryId,
        brandId: sp.brandId,
        isActive: true,
        isFeatured: sampleProducts.indexOf(sp) < 8,
      },
    });

    const variant = await prisma.productVariant.upsert({
      where: { sku: sp.variant.sku },
      update: {},
      create: {
        productId: product.id,
        name: sp.variant.name,
        sku: sp.variant.sku,
        supplierCode: sp.variant.supplierCode,
        purchasePrice: sp.variant.purchasePrice,
        suggestedPrice: sp.variant.suggestedPrice,
        salePrice: sp.variant.salePrice,
        compareAtPrice: sp.variant.compareAtPrice,
        taxExempt: sp.variant.taxExempt,
        unitsPerBox: sp.variant.unitsPerBox,
      },
    });

    await prisma.pharmaceuticalInfo.upsert({
      where: { productId: product.id },
      update: {},
      create: {
        productId: product.id,
        ...sp.pharma,
      },
    });

    // Create a batch + inventory movement
    const batch = await prisma.productBatch.create({
      data: {
        variantId: variant.id,
        batchNumber: `LOT-${sp.variant.sku}`,
        expirationDate: sp.batchExpiry,
        quantityReceived: sp.batchQty,
        costPrice: sp.variant.purchasePrice,
        supplierId: solufarma.id,
      },
    });

    await prisma.inventoryMovement.create({
      data: {
        batchId: batch.id,
        type: 'PURCHASE',
        quantity: sp.batchQty,
        reference: 'Inventario inicial',
        notes: 'Carga inicial del sistema',
      },
    });
  }

  console.log(`✅ ${sampleProducts.length} products with variants, pharma info, and stock created`);

  // ============================================================
  // 9. SETTINGS
  // ============================================================
  const settings = [
    { key: 'store_name', value: 'Farma Madyson', group: 'store' },
    { key: 'store_slogan', value: 'Donde Comienza el Bienestar', group: 'store' },
    { key: 'store_phone', value: '', group: 'store' },
    { key: 'store_email', value: 'farmamadyson@gmail.com', group: 'store' },
    { key: 'store_address', value: '4 Av 2-70 Zona 2, Chimaltenango', group: 'store' },
    { key: 'currency', value: 'GTQ', group: 'store' },
    { key: 'currency_symbol', value: 'Q', group: 'store' },
    { key: 'tax_rate', value: 0.12, group: 'payment' },
    { key: 'tax_name', value: 'IVA', group: 'payment' },
    { key: 'shipping_flat_rate', value: 25.00, group: 'shipping' },
    { key: 'free_shipping_threshold', value: 200.00, group: 'shipping' },
    { key: 'bank_name', value: '', group: 'payment' },
    { key: 'bank_account_name', value: 'FARMA MADYSON, S.A.', group: 'payment' },
    { key: 'bank_account_number', value: '', group: 'payment' },
    { key: 'bank_account_type', value: 'Monetaria', group: 'payment' },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: { key: s.key, value: s.value as any, group: s.group },
    });
  }

  console.log('✅ Settings created');

  // ============================================================
  // 10. NOTIFICATION TEMPLATES
  // ============================================================
  const templates = [
    {
      name: 'order_confirmation',
      subject: 'Pedido confirmado #{{orderNumber}}',
      htmlBody: '<h1>¡Gracias por tu pedido!</h1><p>Tu pedido #{{orderNumber}} ha sido recibido. Total: Q{{totalAmount}}</p>',
      variables: ['orderNumber', 'customerName', 'totalAmount'],
    },
    {
      name: 'two_factor_code',
      subject: 'Tu código de verificación - Farma Madyson',
      htmlBody: '<h1>Código de Verificación</h1><p>Tu código es: <strong>{{code}}</strong></p><p>Este código expira en 5 minutos.</p>',
      variables: ['code', 'userName'],
    },
    {
      name: 'prescription_approved',
      subject: 'Receta aprobada - Pedido #{{orderNumber}}',
      htmlBody: '<h1>Receta Aprobada</h1><p>Tu receta para el pedido #{{orderNumber}} ha sido aprobada. Tu pedido está siendo procesado.</p>',
      variables: ['orderNumber', 'customerName'],
    },
    {
      name: 'prescription_rejected',
      subject: 'Receta rechazada - Pedido #{{orderNumber}}',
      htmlBody: '<h1>Receta Rechazada</h1><p>Tu receta para el pedido #{{orderNumber}} ha sido rechazada. Razón: {{rejectionReason}}</p>',
      variables: ['orderNumber', 'customerName', 'rejectionReason'],
    },
    {
      name: 'password_reset',
      subject: 'Restablecer contraseña - Farma Madyson',
      htmlBody: '<h1>Restablecer Contraseña</h1><p>Haz clic en el siguiente enlace para restablecer tu contraseña: <a href="{{resetUrl}}">Restablecer</a></p>',
      variables: ['resetUrl', 'userName'],
    },
    {
      name: 'email_verification',
      subject: 'Verifica tu email - Farma Madyson',
      htmlBody: '<h1>Verifica tu email</h1><p>Haz clic en el siguiente enlace para verificar tu email: <a href="{{verifyUrl}}">Verificar</a></p>',
      variables: ['verifyUrl', 'userName'],
    },
  ];

  for (const t of templates) {
    await prisma.notificationTemplate.upsert({
      where: { name: t.name },
      update: {},
      create: t,
    });
  }

  console.log('✅ Notification templates created');
  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
