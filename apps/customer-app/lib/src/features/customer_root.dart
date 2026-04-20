import 'package:flutter/material.dart';
import 'package:wassel_mobile/wassel_mobile.dart';

import '../core/app_router.dart';

class CustomerRootScreen extends StatefulWidget {
  const CustomerRootScreen({
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
  State<CustomerRootScreen> createState() => _CustomerRootScreenState();
}

class _CustomerRootScreenState extends State<CustomerRootScreen> {
  late final Future<void> _bootstrapFuture;
  Future<List<OrderRecord>>? _ordersFuture;

  final _emailController = TextEditingController(
    text: developmentSeedCustomerEmail,
  );
  final _passwordController = TextEditingController();
  final _pickupAddressController = TextEditingController(
    text: 'سوق الجمعة، طرابلس',
  );
  final _dropoffAddressController = TextEditingController(
    text: 'حي الأندلس، طرابلس',
  );
  final _pickupNameController = TextEditingController(text: 'نقطة الاستلام');
  final _pickupPhoneController = TextEditingController(text: '+218910000101');
  final _dropoffNameController = TextEditingController(text: 'لينا العميلة');
  final _dropoffPhoneController = TextEditingController(text: '+218910000004');
  final _totalAmountController = TextEditingController(text: '42');
  final _codAmountController = TextEditingController(text: '42');
  final _notesController = TextEditingController(text: 'طلب من تطبيق العملاء');
  final _trackingCodeController = TextEditingController(text: 'TRACK1002');

  int _selectedIndex = 0;
  String? _selectedOrderId;
  TrackingSnapshot? _publicTracking;
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
    _pickupAddressController.dispose();
    _dropoffAddressController.dispose();
    _pickupNameController.dispose();
    _pickupPhoneController.dispose();
    _dropoffNameController.dispose();
    _dropoffPhoneController.dispose();
    _totalAmountController.dispose();
    _codAmountController.dispose();
    _notesController.dispose();
    _trackingCodeController.dispose();
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
      _publicTracking = null;
    });
  }

  Future<void> _handleCreateOrder() async {
    setState(() {
      _submitting = true;
    });

    try {
      final order = await widget.ordersRepository.createOrder(
        CreateOrderInput(
          totalAmount: double.tryParse(_totalAmountController.text) ?? 0,
          codAmount: double.tryParse(_codAmountController.text) ?? 0,
          notes: _notesController.text,
          stops: [
            OrderStopInput(
              sequence: 1,
              type: 'PICKUP',
              label: 'الاستلام',
              addressLine: _pickupAddressController.text,
              contactName: _pickupNameController.text,
              contactPhone: _pickupPhoneController.text,
            ),
            OrderStopInput(
              sequence: 2,
              type: 'DROPOFF',
              label: 'التسليم',
              addressLine: _dropoffAddressController.text,
              contactName: _dropoffNameController.text,
              contactPhone: _dropoffPhoneController.text,
            ),
          ],
        ),
      );
      _trackingCodeController.text = order.publicTrackingCode;
      _showMessage('تم إنشاء الطلب بنجاح.');
      _reloadOrders(order.id);
      setState(() {
        _selectedIndex = 2;
      });
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

  Future<void> _loadPublicTracking() async {
    setState(() {
      _submitting = true;
    });

    try {
      final tracking = await widget.trackingRepository.getPublicTracking(
        _trackingCodeController.text,
      );
      setState(() {
        _publicTracking = tracking;
      });
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
      appBar: AppBar(title: const Text('تسجيل دخول العميل')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _buildHeroCard(
            title: widget.descriptor.appName,
            subtitle:
                'تجربة طلب عربية أولاً متصلة مباشرة بواجهات الطلبات والتتبع.',
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
        icon: Icon(Icons.add_box_rounded),
        label: 'طلب جديد',
      ),
      NavigationDestination(
        icon: Icon(Icons.location_searching_rounded),
        label: 'التتبع',
      ),
      NavigationDestination(
        icon: Icon(Icons.receipt_long_rounded),
        label: 'طلباتي',
      ),
      NavigationDestination(icon: Icon(Icons.person_rounded), label: 'الحساب'),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(
          const ['إنشاء طلب', 'التتبع', 'طلباتي', 'الحساب'][_selectedIndex],
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
              _buildCreateOrderTab(),
              _buildTrackingTab(selectedOrderId),
              _buildOrdersTab(orders),
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

  Widget _buildCreateOrderTab() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _buildHeroCard(
          title: 'إنشاء طلب جديد',
          subtitle:
              'يتم ربط الطلب مباشرة مع الواجهة الحية ويُسند تلقائياً لحساب العميل الحالي.',
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'معلومات الطلب',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _pickupAddressController,
                  decoration: const InputDecoration(
                    labelText: 'عنوان الاستلام',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _dropoffAddressController,
                  decoration: const InputDecoration(labelText: 'عنوان التسليم'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _pickupNameController,
                  decoration: const InputDecoration(
                    labelText: 'اسم جهة الاستلام',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _pickupPhoneController,
                  decoration: const InputDecoration(
                    labelText: 'هاتف جهة الاستلام',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _dropoffNameController,
                  decoration: const InputDecoration(labelText: 'اسم المستلم'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _dropoffPhoneController,
                  decoration: const InputDecoration(labelText: 'هاتف المستلم'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _totalAmountController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'إجمالي القيمة'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _codAmountController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'قيمة التحصيل عند التسليم',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _notesController,
                  decoration: const InputDecoration(labelText: 'ملاحظات الطلب'),
                ),
                const SizedBox(height: 16),
                FilledButton.icon(
                  onPressed: _submitting ? null : _handleCreateOrder,
                  icon: const Icon(Icons.send_rounded),
                  label: Text(
                    _submitting ? 'جارٍ إنشاء الطلب...' : 'إرسال الطلب',
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTrackingTab(String? selectedOrderId) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _buildHeroCard(
          title: 'التتبع العام والخاص',
          subtitle:
              'اعرض خط سير الطلب عبر رمز التتبع العام أو من خلال جلسة العميل الحالية.',
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'التتبع العام',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _trackingCodeController,
                  decoration: const InputDecoration(
                    labelText: 'رمز التتبع العام',
                  ),
                ),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: _submitting ? null : _loadPublicTracking,
                  child: const Text('عرض التتبع العام'),
                ),
                if (_publicTracking != null) ...[
                  const SizedBox(height: 12),
                  Text('الحالة الحالية: ${_publicTracking!.currentStatus}'),
                  Text(
                    'عدد تحديثات الخط الزمني: ${_publicTracking!.timeline.length}',
                  ),
                ],
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        if (selectedOrderId == null)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Text('اختر طلباً من تبويب طلباتي لعرض التتبع الخاص به.'),
            ),
          )
        else
          FutureBuilder<TrackingSnapshot>(
            future: widget.trackingRepository.getOrderTimeline(selectedOrderId),
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

              final tracking = snapshot.data!;

              return Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'التتبع الخاص',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 12),
                      Text('الحالة: ${tracking.currentStatus}'),
                      Text('التتبع العام: ${tracking.publicTrackingCode}'),
                      Text('التحديثات: ${tracking.timeline.length}'),
                      Text('آخر المواقع: ${tracking.locations.length}'),
                    ],
                  ),
                ),
              );
            },
          ),
      ],
    );
  }

  Widget _buildOrdersTab(List<OrderRecord> orders) {
    if (orders.isEmpty) {
      return const Center(
        child: Text('لا توجد طلبات مرتبطة بهذا الحساب حالياً.'),
      );
    }

    return ListView.separated(
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
                  Text('القيمة: ${order.totalAmount.toStringAsFixed(2)} د.ل'),
                  Text('رمز التتبع: ${order.publicTrackingCode}'),
                  Text('إثبات التسليم: ${order.proofOfDeliveryStatus}'),
                  if (order.notes.isNotEmpty) Text('ملاحظات: ${order.notes}'),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildAccountTab() {
    final user = widget.authRepository.currentUser;

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _buildHeroCard(
          title: user?.displayName ?? 'العميل',
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
                  'حالة الإشعارات',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 12),
                const Text(
                  'تم إعداد الهيكل البرمجي للإشعارات، بينما سيأتي ربط القنوات الفعلية في المرحلة التالية.',
                ),
                const SizedBox(height: 16),
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
}

const developmentSeedCustomerEmail = 'customer@wassel-delivery.local';
