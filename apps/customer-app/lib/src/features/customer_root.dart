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
  final _registerNameController = TextEditingController();
  final _registerPhoneController = TextEditingController();
  final _registerEmailController = TextEditingController();
  final _registerPasswordController = TextEditingController();
  final _registerConfirmPasswordController = TextEditingController();
  final _registerCityController = TextEditingController(text: 'طرابلس');
  final _registerAreaController = TextEditingController();
  final _registerPickupAddressController = TextEditingController();
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
  bool _showRegistration = false;

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
    _registerNameController.dispose();
    _registerPhoneController.dispose();
    _registerEmailController.dispose();
    _registerPasswordController.dispose();
    _registerConfirmPasswordController.dispose();
    _registerCityController.dispose();
    _registerAreaController.dispose();
    _registerPickupAddressController.dispose();
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

  Future<void> _handleRegistration() async {
    final validationMessage = _validateRegistration();
    if (validationMessage != null) {
      _showMessage(validationMessage);
      return;
    }

    setState(() {
      _submitting = true;
    });

    try {
      await widget.authRepository.registerCustomer(
        name: _registerNameController.text,
        phone: _registerPhoneController.text,
        email: _registerEmailController.text,
        password: _registerPasswordController.text,
        confirmPassword: _registerConfirmPasswordController.text,
        city: _registerCityController.text,
        defaultArea: _registerAreaController.text,
        defaultPickupAddress: _registerPickupAddressController.text,
      );
      _showMessage('تم إنشاء الحساب بنجاح.');
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

  String? _validateRegistration() {
    if (_registerNameController.text.trim().isEmpty) {
      return 'الاسم مطلوب.';
    }

    if (_registerPhoneController.text.trim().isEmpty) {
      return 'رقم الهاتف مطلوب.';
    }

    final email = _registerEmailController.text.trim();
    if (email.isEmpty ||
        !RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) {
      return 'يرجى إدخال بريد إلكتروني صحيح.';
    }

    if (_registerPasswordController.text.length < 8) {
      return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.';
    }

    if (_registerPasswordController.text !=
        _registerConfirmPasswordController.text) {
      return 'كلمة المرور وتأكيدها غير متطابقين.';
    }

    if (_registerCityController.text.trim().isEmpty) {
      return 'المدينة مطلوبة.';
    }

    return null;
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
      appBar: AppBar(
        title: Text(_showRegistration ? 'إنشاء حساب' : 'تسجيل دخول العميل'),
      ),
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
              child: _showRegistration
                  ? _buildRegistrationForm()
                  : _buildLoginForm(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoginForm() {
    return Column(
      children: [
        TextField(
          controller: _emailController,
          decoration: const InputDecoration(labelText: 'البريد الإلكتروني'),
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
        const SizedBox(height: 8),
        TextButton(
          onPressed: _submitting
              ? null
              : () {
                  setState(() {
                    _showRegistration = true;
                  });
                },
          child: const Text('إنشاء حساب جديد'),
        ),
      ],
    );
  }

  Widget _buildRegistrationForm() {
    return Column(
      children: [
        TextField(
          controller: _registerNameController,
          decoration: const InputDecoration(labelText: 'الاسم'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _registerPhoneController,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(labelText: 'رقم الهاتف'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _registerEmailController,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(labelText: 'البريد الإلكتروني'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _registerPasswordController,
          obscureText: true,
          decoration: const InputDecoration(labelText: 'كلمة المرور'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _registerConfirmPasswordController,
          obscureText: true,
          decoration: const InputDecoration(labelText: 'تأكيد كلمة المرور'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _registerCityController,
          decoration: const InputDecoration(labelText: 'المدينة'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _registerAreaController,
          decoration: const InputDecoration(labelText: 'المنطقة الافتراضية'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _registerPickupAddressController,
          decoration: const InputDecoration(
            labelText: 'عنوان الاستلام الافتراضي',
          ),
        ),
        const SizedBox(height: 16),
        FilledButton.icon(
          onPressed: _submitting ? null : _handleRegistration,
          icon: const Icon(Icons.person_add_alt_1_rounded),
          label: Text(_submitting ? 'جارٍ إنشاء الحساب...' : 'إنشاء حساب'),
        ),
        const SizedBox(height: 8),
        TextButton(
          onPressed: _submitting
              ? null
              : () {
                  setState(() {
                    _showRegistration = false;
                  });
                },
          child: const Text('لدي حساب بالفعل'),
        ),
      ],
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
          subtitle: 'أدخل بيانات الاستلام والتسليم والمبلغ المطلوب تحصيله.',
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
                const SizedBox(height: 8),
                const Text(
                  'سيظهر رمز التتبع مباشرة بعد إنشاء الطلب ويمكن مشاركته مع المستلم.',
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
          subtitle: 'تابع آخر حالة للطلب ورمز التتبع والخط الزمني للتحديثات.',
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
                  _buildTrackingSummary(_publicTracking!),
                  const SizedBox(height: 12),
                  _buildTimeline(_publicTracking!.timeline),
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
                      Text(
                        'الحالة: ${formatArabicOrderStatus(tracking.currentStatus)}',
                      ),
                      Text('التتبع العام: ${tracking.publicTrackingCode}'),
                      Text('آخر المواقع: ${tracking.locations.length}'),
                      const SizedBox(height: 12),
                      _buildTimeline(tracking.timeline),
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
                      Chip(label: Text(formatArabicOrderStatus(order.status))),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text('القيمة: ${formatArabicCurrency(order.totalAmount)}'),
                  Text(
                    'التحصيل النقدي: ${formatArabicCurrency(order.codAmount)}',
                  ),
                  Text('رمز التتبع: ${order.publicTrackingCode}'),
                  Text(
                    'إثبات التسليم: ${formatArabicOrderStatus(order.proofOfDeliveryStatus)}',
                  ),
                  Text('آخر تحديث: ${_latestUpdateText(order.timeline)}'),
                  if (order.notes.isNotEmpty) Text('ملاحظات: ${order.notes}'),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      OutlinedButton.icon(
                        onPressed: () =>
                            _showMessage('سيتم ربط الدعم في المرحلة التالية.'),
                        icon: const Icon(Icons.support_agent_rounded),
                        label: const Text('الدعم'),
                      ),
                      OutlinedButton.icon(
                        onPressed: () =>
                            _showMessage('سيتم ربط واتساب في المرحلة التالية.'),
                        icon: const Icon(Icons.chat_rounded),
                        label: const Text('واتساب'),
                      ),
                    ],
                  ),
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
                  'إدارة بيانات الحساب والدعم ستتوفر كخطوة تشغيلية لاحقة.',
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    OutlinedButton.icon(
                      onPressed: () =>
                          _showMessage('سيتم ربط مركز الدعم قريباً.'),
                      icon: const Icon(Icons.support_agent_rounded),
                      label: const Text('تواصل مع الدعم'),
                    ),
                    OutlinedButton.icon(
                      onPressed: () =>
                          _showMessage('سيتم ربط تحديث بيانات الحساب قريباً.'),
                      icon: const Icon(Icons.manage_accounts_rounded),
                      label: const Text('تحديث البيانات'),
                    ),
                  ],
                ),
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
          if (widget.descriptor.environmentLabel.isNotEmpty) ...[
            Text(
              widget.descriptor.environmentLabel,
              style: const TextStyle(
                color: Colors.white70,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 12),
          ],
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

  Widget _buildTrackingSummary(TrackingSnapshot tracking) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'الحالة الحالية: ${formatArabicOrderStatus(tracking.currentStatus)}',
        ),
        Text('رمز التتبع: ${tracking.publicTrackingCode}'),
        Text('آخر تحديث: ${_latestUpdateText(tracking.timeline)}'),
      ],
    );
  }

  Widget _buildTimeline(List<TrackingEntry> entries) {
    if (entries.isEmpty) {
      return const Text('لا توجد تحديثات بعد.');
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('خط سير الطلب', style: Theme.of(context).textTheme.titleSmall),
        const SizedBox(height: 8),
        for (final entry in entries)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Padding(
                  padding: EdgeInsets.only(top: 5),
                  child: Icon(Icons.radio_button_checked, size: 14),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(formatArabicOrderStatus(entry.status)),
                      if (entry.note.isNotEmpty) Text(entry.note),
                      Text(
                        formatArabicDateTime(entry.createdAt),
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  String _latestUpdateText(List<TrackingEntry> entries) {
    if (entries.isEmpty) {
      return 'غير متاح';
    }

    return formatArabicDateTime(entries.last.createdAt);
  }
}

const developmentSeedCustomerEmail = 'customer@wassel-delivery.local';
