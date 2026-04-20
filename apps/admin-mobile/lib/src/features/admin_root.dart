import 'package:flutter/material.dart';
import 'package:wassel_mobile/wassel_mobile.dart';

import '../core/app_router.dart';

class AdminRootScreen extends StatefulWidget {
  const AdminRootScreen({
    super.key,
    required this.descriptor,
    required this.environment,
    required this.client,
    required this.authRepository,
    required this.ordersRepository,
    required this.operationsRepository,
  });

  final MobileAppDescriptor descriptor;
  final WasselMobileEnvironment environment;
  final WasselApiClient client;
  final AuthRepository authRepository;
  final OrdersRepository ordersRepository;
  final OperationsRepository operationsRepository;

  @override
  State<AdminRootScreen> createState() => _AdminRootScreenState();
}

class _AdminRootScreenState extends State<AdminRootScreen> {
  late final Future<void> _bootstrapFuture;
  Future<List<OrderRecord>>? _ordersFuture;
  Future<List<OrderRecord>>? _dispatchFuture;
  Future<List<DriverRecord>>? _driversFuture;
  Future<List<MerchantRecord>>? _merchantsFuture;
  Future<List<SettlementRecord>>? _settlementsFuture;
  Future<DashboardSummary>? _dashboardFuture;

  final _emailController = TextEditingController(
    text: developmentSeedAdminEmail,
  );
  final _passwordController = TextEditingController();

  int _selectedIndex = 0;
  String? _selectedOrderId;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _passwordController.text = widget.environment.seedPassword;
    _bootstrapFuture = _bootstrap();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    await widget.authRepository.bootstrap();

    if (widget.authRepository.isAuthenticated) {
      _reloadData();
    }
  }

  void _reloadData([String? preferredOrderId]) {
    setState(() {
      _selectedOrderId = preferredOrderId ?? _selectedOrderId;
      _dashboardFuture = widget.operationsRepository.getDashboardSummary();
      _ordersFuture = widget.ordersRepository.listOrders();
      _dispatchFuture = widget.operationsRepository.getDispatchJobs();
      _driversFuture = widget.operationsRepository.listDrivers();
      _merchantsFuture = widget.operationsRepository.listMerchants();
      _settlementsFuture = widget.operationsRepository.listSettlements();
    });
  }

  Future<void> _handleLogin() async {
    setState(() {
      _submitting = true;
    });

    try {
      await widget.authRepository.login(
        email: _emailController.text,
        password: _passwordController.text,
      );
      _reloadData();
    } catch (error) {
      _showMessage(error.toString());
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }

  Future<void> _handleLogout() async {
    await widget.authRepository.logout();
    setState(() {
      _ordersFuture = null;
      _dispatchFuture = null;
      _driversFuture = null;
      _merchantsFuture = null;
      _settlementsFuture = null;
      _dashboardFuture = null;
      _selectedOrderId = null;
    });
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<void>(
      future: _bootstrapFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        return AnimatedBuilder(
          animation: widget.client,
          builder: (context, _) {
            if (!widget.authRepository.isAuthenticated) {
              return _buildLoginScreen();
            }

            _dashboardFuture ??= widget.operationsRepository
                .getDashboardSummary();
            _ordersFuture ??= widget.ordersRepository.listOrders();
            _dispatchFuture ??= widget.operationsRepository.getDispatchJobs();
            _driversFuture ??= widget.operationsRepository.listDrivers();
            _merchantsFuture ??= widget.operationsRepository.listMerchants();
            _settlementsFuture ??= widget.operationsRepository
                .listSettlements();

            return _buildAuthenticatedShell();
          },
        );
      },
    );
  }

  Widget _buildLoginScreen() {
    return Scaffold(
      appBar: AppBar(title: const Text('تسجيل دخول الإدارة المتنقلة')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _buildHeroCard(
            title: widget.descriptor.appName,
            subtitle:
                'ربط مباشر مع مؤشرات التشغيل والكيانات الرئيسية من الهاتف.',
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  TextField(
                    controller: _emailController,
                    decoration: const InputDecoration(
                      labelText: 'البريد الإلكتروني',
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _passwordController,
                    obscureText: true,
                    decoration: const InputDecoration(labelText: 'كلمة المرور'),
                  ),
                  const SizedBox(height: 16),
                  FilledButton.icon(
                    onPressed: _submitting ? null : _handleLogin,
                    icon: const Icon(Icons.login_rounded),
                    label: Text(_submitting ? 'جارٍ تسجيل الدخول...' : 'دخول'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAuthenticatedShell() {
    const destinations = [
      NavigationDestination(
        icon: Icon(Icons.space_dashboard_rounded),
        label: 'اللوحة',
      ),
      NavigationDestination(
        icon: Icon(Icons.list_alt_rounded),
        label: 'الطلبات',
      ),
      NavigationDestination(
        icon: Icon(Icons.people_alt_rounded),
        label: 'الكيانات',
      ),
      NavigationDestination(
        icon: Icon(Icons.account_balance_wallet_rounded),
        label: 'المالية',
      ),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(
          const [
            'اللوحة التنفيذية',
            'الطلبات والتوزيع',
            'السائقون والتجار',
            'التسويات',
          ][_selectedIndex],
        ),
        actions: [
          IconButton(
            onPressed: _reloadData,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: IndexedStack(
        index: _selectedIndex,
        children: [
          _buildOverviewTab(),
          _buildOrdersTab(),
          _buildEntitiesTab(),
          _buildFinanceTab(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        destinations: destinations,
        onDestinationSelected: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
      ),
    );
  }

  Widget _buildOverviewTab() {
    return FutureBuilder<DashboardSummary>(
      future: _dashboardFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }

        if (snapshot.hasError) {
          return Center(child: Text(snapshot.error.toString()));
        }

        final summary = snapshot.data!;

        return ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _buildHeroCard(
              title: 'ملخص العمليات الحي',
              subtitle: 'مؤشرات مباشرة من واجهة dashboard-summary.',
            ),
            const SizedBox(height: 16),
            _buildStatCard(
              'إجمالي الطلبات',
              summary.totalOrders.toString(),
              Icons.receipt_long_rounded,
            ),
            const SizedBox(height: 12),
            _buildStatCard(
              'الطلبات النشطة',
              summary.activeOrders.toString(),
              Icons.route_rounded,
            ),
            const SizedBox(height: 12),
            _buildStatCard(
              'السائقون المتاحون',
              summary.availableDrivers.toString(),
              Icons.drive_eta_rounded,
            ),
            const SizedBox(height: 12),
            _buildStatCard(
              'السائقون المشغولون',
              summary.busyDrivers.toString(),
              Icons.local_shipping_rounded,
            ),
            const SizedBox(height: 12),
            _buildStatCard(
              'التجار',
              summary.merchants.toString(),
              Icons.storefront_rounded,
            ),
          ],
        );
      },
    );
  }

  Widget _buildOrdersTab() {
    return FutureBuilder<List<OrderRecord>>(
      future: _ordersFuture,
      builder: (context, ordersSnapshot) {
        if (ordersSnapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }

        if (ordersSnapshot.hasError) {
          return Center(child: Text(ordersSnapshot.error.toString()));
        }

        final orders = ordersSnapshot.data ?? const <OrderRecord>[];
        final selectedOrderId =
            _selectedOrderId ?? (orders.isEmpty ? null : orders.first.id);

        return ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _buildHeroCard(
              title: 'الطلبات والتوزيع',
              subtitle:
                  'قائمة الطلبات الحية مع تفاصيل الطلب المختار وقائمة التوزيع المفتوحة.',
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'قائمة الطلبات',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 12),
                    for (final order in orders.take(8))
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text(order.referenceCode),
                        subtitle: Text('الحالة: ${order.status}'),
                        trailing: const Icon(Icons.chevron_left_rounded),
                        onTap: () {
                          setState(() {
                            _selectedOrderId = order.id;
                          });
                        },
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            if (selectedOrderId != null)
              FutureBuilder<OrderRecord>(
                future: widget.ordersRepository.getOrder(selectedOrderId),
                builder: (context, detailSnapshot) {
                  if (detailSnapshot.connectionState != ConnectionState.done) {
                    return const Card(
                      child: Padding(
                        padding: EdgeInsets.all(20),
                        child: Center(child: CircularProgressIndicator()),
                      ),
                    );
                  }

                  if (detailSnapshot.hasError) {
                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Text(detailSnapshot.error.toString()),
                      ),
                    );
                  }

                  final order = detailSnapshot.data!;

                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'تفاصيل الطلب',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 12),
                          Text('المرجع: ${order.referenceCode}'),
                          Text('الحالة: ${order.status}'),
                          Text('التاجر: ${order.merchantName}'),
                          Text('السائق: ${order.driverName}'),
                          Text(
                            'القيمة: ${order.totalAmount.toStringAsFixed(2)} د.ل',
                          ),
                          Text('إثبات التسليم: ${order.proofOfDeliveryStatus}'),
                        ],
                      ),
                    ),
                  );
                },
              ),
            const SizedBox(height: 16),
            FutureBuilder<List<OrderRecord>>(
              future: _dispatchFuture,
              builder: (context, dispatchSnapshot) {
                if (dispatchSnapshot.connectionState != ConnectionState.done) {
                  return const Card(
                    child: Padding(
                      padding: EdgeInsets.all(20),
                      child: Center(child: CircularProgressIndicator()),
                    ),
                  );
                }

                if (dispatchSnapshot.hasError) {
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Text(dispatchSnapshot.error.toString()),
                    ),
                  );
                }

                final jobs = dispatchSnapshot.data ?? const <OrderRecord>[];

                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'قائمة التوزيع',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 12),
                        for (final job in jobs.take(6))
                          ListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Text(job.referenceCode),
                            subtitle: Text('الحالة: ${job.status}'),
                          ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ],
        );
      },
    );
  }

  Widget _buildEntitiesTab() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _buildHeroCard(
          title: 'السائقون والتجار',
          subtitle: 'عرض حي لقوائم السائقين والتجار من الواجهات الإدارية.',
        ),
        const SizedBox(height: 16),
        FutureBuilder<List<DriverRecord>>(
          future: _driversFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Card(
                child: Padding(
                  padding: EdgeInsets.all(20),
                  child: Center(child: CircularProgressIndicator()),
                ),
              );
            }

            if (snapshot.hasError) {
              return Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Text(snapshot.error.toString()),
                ),
              );
            }

            final drivers = snapshot.data ?? const <DriverRecord>[];

            return Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'السائقون',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 12),
                    for (final driver in drivers.take(8))
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text(driver.name),
                        subtitle: Text(
                          '${driver.status} • ${driver.activeAssignments} مهام',
                        ),
                      ),
                  ],
                ),
              ),
            );
          },
        ),
        const SizedBox(height: 16),
        FutureBuilder<List<MerchantRecord>>(
          future: _merchantsFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Card(
                child: Padding(
                  padding: EdgeInsets.all(20),
                  child: Center(child: CircularProgressIndicator()),
                ),
              );
            }

            if (snapshot.hasError) {
              return Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Text(snapshot.error.toString()),
                ),
              );
            }

            final merchants = snapshot.data ?? const <MerchantRecord>[];

            return Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'التجار',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 12),
                    for (final merchant in merchants.take(8))
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text(merchant.name),
                        subtitle: Text(
                          '${merchant.city} • ${merchant.ordersCount} طلبات',
                        ),
                      ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildFinanceTab() {
    return FutureBuilder<List<SettlementRecord>>(
      future: _settlementsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }

        if (snapshot.hasError) {
          return Center(child: Text(snapshot.error.toString()));
        }

        final settlements = snapshot.data ?? const <SettlementRecord>[];
        final totalPending = settlements
            .where((settlement) => settlement.status == 'PENDING')
            .fold<double>(0, (total, settlement) => total + settlement.amount);

        return ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _buildHeroCard(
              title: 'التسويات',
              subtitle: 'ملخص سريع لحالة التسويات والحركات المفتوحة.',
            ),
            const SizedBox(height: 16),
            _buildStatCard(
              'إجمالي المعلّق',
              totalPending.toStringAsFixed(2),
              Icons.payments_rounded,
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'آخر التسويات',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 12),
                    for (final settlement in settlements.take(8))
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text(settlement.ledgerCode),
                        subtitle: Text(
                          '${settlement.status} • ${settlement.description}',
                        ),
                        trailing: Text(settlement.amount.toStringAsFixed(2)),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'الحساب',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 12),
                    Text('API: ${widget.environment.apiBaseUrl}'),
                    const SizedBox(height: 16),
                    FilledButton.icon(
                      onPressed: _handleLogout,
                      icon: const Icon(Icons.logout_rounded),
                      label: const Text('تسجيل الخروج'),
                    ),
                  ],
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildHeroCard({required String title, required String subtitle}) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: LinearGradient(
          colors: [
            widget.descriptor.seedColor.withValues(alpha: 0.94),
            widget.descriptor.seedColor.withValues(alpha: 0.72),
          ],
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.descriptor.environmentLabel,
            style: const TextStyle(
              color: Colors.white70,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 28,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            subtitle,
            style: const TextStyle(color: Colors.white, height: 1.6),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon) {
    return Card(
      child: ListTile(
        leading: CircleAvatar(child: Icon(icon)),
        title: Text(title),
        subtitle: Text(value, style: Theme.of(context).textTheme.headlineSmall),
      ),
    );
  }
}

const developmentSeedAdminEmail = 'admin@wassel-delivery.local';
