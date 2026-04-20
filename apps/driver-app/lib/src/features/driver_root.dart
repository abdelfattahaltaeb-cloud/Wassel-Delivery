import 'package:flutter/material.dart';
import 'package:wassel_mobile/wassel_mobile.dart';

import '../core/app_router.dart';

class DriverRootScreen extends StatefulWidget {
  const DriverRootScreen({
    super.key,
    required this.descriptor,
    required this.environment,
    required this.client,
    required this.authRepository,
    required this.ordersRepository,
    required this.trackingRepository,
  });

  final MobileAppDescriptor descriptor;
  final WasselMobileEnvironment environment;
  final WasselApiClient client;
  final AuthRepository authRepository;
  final OrdersRepository ordersRepository;
  final TrackingRepository trackingRepository;

  @override
  State<DriverRootScreen> createState() => _DriverRootScreenState();
}

class _DriverRootScreenState extends State<DriverRootScreen> {
  late final Future<void> _bootstrapFuture;
  Future<List<OrderRecord>>? _ordersFuture;

  final _emailController = TextEditingController(
    text: developmentSeedDriverEmail,
  );
  final _passwordController = TextEditingController();
  final _noteController = TextEditingController();
  final _photoUrlController = TextEditingController(
    text: 'https://example.com/pod/driver-app.jpg',
  );
  final _otpController = TextEditingController(text: '1234');
  final _recipientController = TextEditingController(text: 'مستلم الطلب');
  final _failureReasonController = TextEditingController(
    text: 'تعذر الوصول إلى العميل',
  );
  final _locationLatitudeController = TextEditingController(text: '32.8895');
  final _locationLongitudeController = TextEditingController(text: '13.1950');
  final _locationAccuracyController = TextEditingController(text: '6');

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
    _noteController.dispose();
    _photoUrlController.dispose();
    _otpController.dispose();
    _recipientController.dispose();
    _failureReasonController.dispose();
    _locationLatitudeController.dispose();
    _locationLongitudeController.dispose();
    _locationAccuracyController.dispose();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    await widget.authRepository.bootstrap();

    if (widget.authRepository.isAuthenticated) {
      _reloadOrders();
    }
  }

  void _reloadOrders([String? preferredOrderId]) {
    setState(() {
      _selectedOrderId = preferredOrderId ?? _selectedOrderId;
      _ordersFuture = widget.ordersRepository.listOrders();
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
      _reloadOrders();
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
      _selectedOrderId = null;
    });
  }

  Future<void> _performOrderAction(
    Future<OrderRecord> Function() action,
    String successMessage,
  ) async {
    setState(() {
      _submitting = true;
    });

    try {
      final order = await action();
      _showMessage(successMessage);
      _reloadOrders(order.id);
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

  Future<void> _sendLocationUpdate(String orderId) async {
    setState(() {
      _submitting = true;
    });

    try {
      await widget.trackingRepository.sendLocation(
        LocationUpdateInput(
          orderId: orderId,
          latitude: double.tryParse(_locationLatitudeController.text) ?? 0,
          longitude: double.tryParse(_locationLongitudeController.text) ?? 0,
          accuracyMeters: double.tryParse(_locationAccuracyController.text),
        ),
      );
      _showMessage('تم إرسال موقع السائق إلى النظام.');
      _reloadOrders(orderId);
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

            _ordersFuture ??= widget.ordersRepository.listOrders();

            return _buildAuthenticatedShell();
          },
        );
      },
    );
  }

  Widget _buildLoginScreen() {
    return Scaffold(
      appBar: AppBar(title: const Text('تسجيل دخول السائق')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _buildHeroCard(
            title: widget.descriptor.appName,
            subtitle: 'ربط مباشر مع واجهات المهام، الحالة، وإثبات التسليم.',
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  TextField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
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
        icon: Icon(Icons.assignment_rounded),
        label: 'المهام',
      ),
      NavigationDestination(
        icon: Icon(Icons.local_shipping_rounded),
        label: 'التنفيذ',
      ),
      NavigationDestination(
        icon: Icon(Icons.insights_rounded),
        label: 'النشاط',
      ),
      NavigationDestination(
        icon: Icon(Icons.person_pin_rounded),
        label: 'الحساب',
      ),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(
          const [
            'المهام الحالية',
            'تنفيذ المهمة',
            'ملخص النشاط',
            'الحساب',
          ][_selectedIndex],
        ),
        actions: [
          IconButton(
            onPressed: _ordersFuture == null ? null : () => _reloadOrders(),
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: FutureBuilder<List<OrderRecord>>(
        future: _ordersFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(child: Text(snapshot.error.toString()));
          }

          final orders = snapshot.data ?? const <OrderRecord>[];
          final selectedOrderId =
              _selectedOrderId ?? (orders.isEmpty ? null : orders.first.id);

          return IndexedStack(
            index: _selectedIndex,
            children: [
              _buildJobsTab(orders),
              _buildExecutionTab(selectedOrderId),
              _buildActivityTab(orders),
              _buildAccountTab(),
            ],
          );
        },
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

  Widget _buildJobsTab(List<OrderRecord> orders) {
    if (orders.isEmpty) {
      return const Center(
        child: Text('لا توجد مهام مرتبطة بهذا السائق حالياً.'),
      );
    }

    return RefreshIndicator(
      onRefresh: () async => _reloadOrders(),
      child: ListView.separated(
        padding: const EdgeInsets.all(20),
        itemCount: orders.length,
        separatorBuilder: (_, _) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final order = orders[index];

          return Card(
            child: InkWell(
              borderRadius: BorderRadius.circular(24),
              onTap: () {
                setState(() {
                  _selectedOrderId = order.id;
                  _selectedIndex = 1;
                });
              },
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            order.referenceCode,
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                        ),
                        Chip(label: Text(order.status)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text('التاجر: ${order.merchantName}'),
                    const SizedBox(height: 4),
                    Text(
                      'قيمة الطلب: ${order.totalAmount.toStringAsFixed(2)} د.ل',
                    ),
                    const SizedBox(height: 8),
                    for (final stop in order.stops)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Text(
                          '${stop.sequence}. ${stop.label} - ${stop.addressLine}',
                        ),
                      ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildExecutionTab(String? selectedOrderId) {
    if (selectedOrderId == null) {
      return const Center(child: Text('اختر مهمة من تبويب المهام للمتابعة.'));
    }

    return FutureBuilder<OrderRecord>(
      future: widget.ordersRepository.getOrder(selectedOrderId),
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }

        if (snapshot.hasError) {
          return Center(child: Text(snapshot.error.toString()));
        }

        final order = snapshot.data!;

        return ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _buildHeroCard(
              title: order.referenceCode,
              subtitle: 'الحالة الحالية: ${order.status}',
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'تفاصيل المهمة',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 12),
                    Text('التاجر: ${order.merchantName}'),
                    Text('العميل: ${order.customerName}'),
                    Text('التتبع العام: ${order.publicTrackingCode}'),
                    Text('إثبات التسليم: ${order.proofOfDeliveryStatus}'),
                    if (order.notes.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text('ملاحظات: ${order.notes}'),
                    ],
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
                      'إجراءات الحالة',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _noteController,
                      decoration: const InputDecoration(
                        labelText: 'ملاحظة التشغيل',
                      ),
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        if (order.status == 'ASSIGNED')
                          FilledButton(
                            onPressed: _submitting
                                ? null
                                : () => _performOrderAction(
                                    () => widget.ordersRepository.acceptOrder(
                                      order.id,
                                      note: _noteController.text,
                                    ),
                                    'تم قبول المهمة.',
                                  ),
                            child: const Text('قبول المهمة'),
                          ),
                        if (order.status == 'DRIVER_ACCEPTED')
                          FilledButton(
                            onPressed: _submitting
                                ? null
                                : () => _performOrderAction(
                                    () => widget.ordersRepository.pickupOrder(
                                      order.id,
                                      note: _noteController.text,
                                    ),
                                    'تم تسجيل الاستلام.',
                                  ),
                            child: const Text('استلام الطلب'),
                          ),
                        if (order.status == 'PICKED_UP')
                          FilledButton(
                            onPressed: _submitting
                                ? null
                                : () => _performOrderAction(
                                    () => widget.ordersRepository.markInTransit(
                                      order.id,
                                      note: _noteController.text,
                                    ),
                                    'تم تحويل الطلب إلى قيد التوصيل.',
                                  ),
                            child: const Text('قيد التوصيل'),
                          ),
                        if (order.status == 'PICKED_UP' ||
                            order.status == 'IN_TRANSIT')
                          OutlinedButton(
                            onPressed: _submitting
                                ? null
                                : () => _sendLocationUpdate(order.id),
                            child: const Text('إرسال الموقع'),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            if (order.status == 'PICKED_UP' ||
                order.status == 'IN_TRANSIT') ...[
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'إثبات التسليم أو الفشل',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _photoUrlController,
                        decoration: const InputDecoration(
                          labelText: 'رابط صورة التسليم',
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _otpController,
                        decoration: const InputDecoration(labelText: 'رمز OTP'),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _recipientController,
                        decoration: const InputDecoration(
                          labelText: 'اسم المستلم',
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _failureReasonController,
                        decoration: const InputDecoration(
                          labelText: 'سبب فشل التوصيل',
                        ),
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          FilledButton(
                            onPressed: _submitting
                                ? null
                                : () => _performOrderAction(
                                    () => widget.ordersRepository.deliverOrder(
                                      order.id,
                                      DeliveryInput(
                                        note: _noteController.text,
                                        deliveredPhotoUrl:
                                            _photoUrlController.text,
                                        otpCode: _otpController.text,
                                        recipientName:
                                            _recipientController.text,
                                      ),
                                    ),
                                    'تم تسجيل التسليم بنجاح.',
                                  ),
                            child: const Text('تسليم الطلب'),
                          ),
                          OutlinedButton(
                            onPressed: _submitting
                                ? null
                                : () => _performOrderAction(
                                    () => widget.ordersRepository.failDelivery(
                                      order.id,
                                      FailDeliveryInput(
                                        failureReason:
                                            _failureReasonController.text,
                                        note: _noteController.text,
                                      ),
                                    ),
                                    'تم تسجيل فشل التوصيل.',
                                  ),
                            child: const Text('فشل التوصيل'),
                          ),
                        ],
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
                        'إحداثيات الموقع',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _locationLatitudeController,
                        decoration: const InputDecoration(
                          labelText: 'خط العرض',
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _locationLongitudeController,
                        decoration: const InputDecoration(
                          labelText: 'خط الطول',
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _locationAccuracyController,
                        decoration: const InputDecoration(
                          labelText: 'الدقة بالمتر',
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        );
      },
    );
  }

  Widget _buildActivityTab(List<OrderRecord> orders) {
    final delivered = orders
        .where((order) => order.status == 'DELIVERED')
        .length;
    final inFlight = orders
        .where(
          (order) => const {
            'ASSIGNED',
            'DRIVER_ACCEPTED',
            'PICKED_UP',
            'IN_TRANSIT',
          }.contains(order.status),
        )
        .length;
    final failed = orders
        .where((order) => order.status == 'FAILED_DELIVERY')
        .length;

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _buildHeroCard(
          title: 'ملخص اليوم التشغيلي',
          subtitle:
              'الأرباح التفصيلية ما زالت تحتاج واجهة تسويات خاصة بالسائق.',
        ),
        const SizedBox(height: 16),
        _buildStatCard(
          'المهام النشطة',
          inFlight.toString(),
          Icons.route_rounded,
        ),
        const SizedBox(height: 12),
        _buildStatCard(
          'المهام المسلّمة',
          delivered.toString(),
          Icons.check_circle_rounded,
        ),
        const SizedBox(height: 12),
        _buildStatCard(
          'المهام المتعثرة',
          failed.toString(),
          Icons.warning_rounded,
        ),
      ],
    );
  }

  Widget _buildAccountTab() {
    final user = widget.authRepository.currentUser;

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _buildHeroCard(
          title: user?.displayName ?? 'السائق',
          subtitle: user?.email ?? '',
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'البيئة الحالية',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 12),
                Text('API: ${widget.environment.apiBaseUrl}'),
                Text('الأدوار: ${user?.roles.join(', ') ?? '-'}'),
                Text('الصلاحيات: ${user?.permissions.length ?? 0}'),
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

const developmentSeedDriverEmail = 'driver@wassel-delivery.local';
