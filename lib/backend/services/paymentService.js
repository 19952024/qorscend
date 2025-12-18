const stripe = require('stripe');
const paypal = require('@paypal/checkout-server-sdk');
const logger = require('../utils/logger');

class PaymentService {
  constructor() {
    this.stripe = null;
    this.paypal = null;
    this.initializeProviders();
  }

  initializeProviders() {
    // Initialize Stripe
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = stripe(process.env.STRIPE_SECRET_KEY);
      logger.info('Stripe payment service initialized');
    } else {
      logger.warn('Stripe not configured - STRIPE_SECRET_KEY not found');
    }

    // Initialize PayPal
    if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
      const environment = process.env.NODE_ENV === 'production' 
        ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
        : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);
      
      this.paypal = new paypal.core.PayPalHttpClient(environment);
      logger.info('PayPal payment service initialized');
    } else {
      logger.warn('PayPal not configured - PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET not found');
    }
  }

  // Stripe Payment Methods
  async createStripeCustomer(user) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id
        }
      });

      return customer;
    } catch (error) {
      logger.error('Stripe customer creation error:', error);
      throw error;
    }
  }

  async createStripePaymentMethod(paymentMethodData) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      const paymentMethod = await this.stripe.paymentMethods.create({
        type: 'card',
        card: {
          token: paymentMethodData.token
        },
        billing_details: {
          name: paymentMethodData.name,
          email: paymentMethodData.email
        }
      });

      return paymentMethod;
    } catch (error) {
      logger.error('Stripe payment method creation error:', error);
      throw error;
    }
  }

  async createStripeSubscription(customerId, priceId, paymentMethodId) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      // Attach payment method to customer
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set as default payment method
      await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Create subscription
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      return subscription;
    } catch (error) {
      logger.error('Stripe subscription creation error:', error);
      throw error;
    }
  }

  async createStripeCheckoutSession(priceId, successUrl, cancelUrl, customerEmail) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: customerEmail,
      });

      return session;
    } catch (error) {
      logger.error('Stripe checkout session creation error:', error);
      throw error;
    }
  }

  // PayPal Payment Methods
  async createPayPalOrder(amount, currency = 'USD', description = 'QORSCEND Subscription') {
    if (!this.paypal) {
      throw new Error('PayPal not configured');
    }

    try {
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody({
        intent: 'SUBSCRIPTION',
        application_context: {
          return_url: process.env.PAYPAL_RETURN_URL || 'https://www.qorscend.com/dashboard/billing',
          cancel_url: process.env.PAYPAL_CANCEL_URL || 'https://www.qorscend.com/dashboard/billing',
        },
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: amount.toString()
          },
          description: description
        }]
      });

      const order = await this.paypal.execute(request);
      return order;
    } catch (error) {
      logger.error('PayPal order creation error:', error);
      throw error;
    }
  }

  async createPayPalSubscription(planId, startTime) {
    if (!this.paypal) {
      throw new Error('PayPal not configured');
    }

    try {
      const request = new paypal.catalogs.ProductsPostRequest();
      request.requestBody({
        plan_id: planId,
        start_time: startTime,
        quantity: "1",
        shipping_amount: {
          currency_code: "USD",
          value: "0"
        },
        subscriber: {
          name: {
            given_name: "John",
            surname: "Doe"
          },
          email_address: "customer@example.com"
        },
        return_url: process.env.PAYPAL_RETURN_URL || 'https://www.qorscend.com/dashboard/billing',
        cancel_url: process.env.PAYPAL_CANCEL_URL || 'https://www.qorscend.com/dashboard/billing'
      });

      const subscription = await this.paypal.execute(request);
      return subscription;
    } catch (error) {
      logger.error('PayPal subscription creation error:', error);
      throw error;
    }
  }

  // Webhook Handlers
  async handleStripeWebhook(event) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        default:
          logger.info(`Unhandled Stripe event type: ${event.type}`);
      }
    } catch (error) {
      logger.error('Stripe webhook handling error:', error);
      throw error;
    }
  }

  async handlePayPalWebhook(event) {
    if (!this.paypal) {
      throw new Error('PayPal not configured');
    }

    try {
      switch (event.event_type) {
        case 'BILLING.SUBSCRIPTION.CREATED':
          await this.handlePayPalSubscriptionCreated(event.resource);
          break;
        case 'BILLING.SUBSCRIPTION.ACTIVATED':
          await this.handlePayPalSubscriptionActivated(event.resource);
          break;
        case 'BILLING.SUBSCRIPTION.CANCELLED':
          await this.handlePayPalSubscriptionCancelled(event.resource);
          break;
        case 'PAYMENT.CAPTURE.COMPLETED':
          await this.handlePayPalPaymentCompleted(event.resource);
          break;
        default:
          logger.info(`Unhandled PayPal event type: ${event.event_type}`);
      }
    } catch (error) {
      logger.error('PayPal webhook handling error:', error);
      throw error;
    }
  }

  // Subscription Event Handlers
  async handleSubscriptionCreated(subscription) {
    logger.info(`Stripe subscription created: ${subscription.id}`);
    // Update user subscription in database
    // This would typically update a Subscription model
  }

  async handleSubscriptionUpdated(subscription) {
    logger.info(`Stripe subscription updated: ${subscription.id}`);
    // Update user subscription status in database
  }

  async handleSubscriptionDeleted(subscription) {
    logger.info(`Stripe subscription deleted: ${subscription.id}`);
    // Cancel user subscription in database
  }

  async handlePaymentSucceeded(invoice) {
    logger.info(`Stripe payment succeeded: ${invoice.id}`);
    // Record successful payment in database
  }

  async handlePaymentFailed(invoice) {
    logger.info(`Stripe payment failed: ${invoice.id}`);
    // Handle failed payment (send notification, etc.)
  }

  async handlePayPalSubscriptionCreated(subscription) {
    logger.info(`PayPal subscription created: ${subscription.id}`);
    // Update user subscription in database
  }

  async handlePayPalSubscriptionActivated(subscription) {
    logger.info(`PayPal subscription activated: ${subscription.id}`);
    // Activate user subscription in database
  }

  async handlePayPalSubscriptionCancelled(subscription) {
    logger.info(`PayPal subscription cancelled: ${subscription.id}`);
    // Cancel user subscription in database
  }

  async handlePayPalPaymentCompleted(payment) {
    logger.info(`PayPal payment completed: ${payment.id}`);
    // Record successful payment in database
  }

  // Utility Methods
  getPriceId(plan) {
    const priceMap = {
      'free': null,
      'pro': process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
      'enterprise': process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_monthly'
    };
    return priceMap[plan];
  }

  getPayPalPlanId(plan) {
    const planMap = {
      'free': null,
      'pro': process.env.PAYPAL_PRO_PLAN_ID || 'P-5ML4271244454362XMQIZHI',
      'enterprise': process.env.PAYPAL_ENTERPRISE_PLAN_ID || 'P-5ML4271244454362XMQIZHI'
    };
    return planMap[plan];
  }

  // Mock payment processing for development
  async processMockPayment(amount, currency = 'USD') {
    logger.info(`Processing mock payment: ${amount} ${currency}`);
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate 95% success rate
    const success = Math.random() > 0.05;
    
    if (success) {
      return {
        success: true,
        transactionId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount,
        currency,
        status: 'completed'
      };
    } else {
      throw new Error('Mock payment failed');
    }
  }

  // Get available payment methods
  getAvailableProviders() {
    const providers = [];
    
    if (this.stripe) {
      providers.push('stripe');
    }
    
    if (this.paypal) {
      providers.push('paypal');
    }
    
    if (providers.length === 0) {
      providers.push('mock');
    }
    
    return providers;
  }
}

module.exports = new PaymentService(); 