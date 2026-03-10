import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { 
  ChefHat, 
  Users, 
  TrendingUp, 
  BarChart3, 
  ShoppingCart, 
  Package,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Moon,
  Sun
} from 'lucide-react';

const Landing = () => {
  const { theme, toggleTheme } = useTheme();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-orange-100 dark:border-gray-700 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img
                src="/Bakerly Logo.png"
                alt="Bakerly Logo"
                className="h-10 w-10 object-contain"
              />
              <span className="text-xl font-bold text-orange-600 dark:text-orange-400">Bakerly</span>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => scrollToSection('about')}
                className="text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-medium"
              >
                About
              </button>
              <button 
                onClick={() => scrollToSection('features')}
                className="text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-medium"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-medium"
              >
                Contact
              </button>
            </div>

            {/* Auth Buttons & Theme Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
              <Link to="/login">
                <Button variant="ghost" className="text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400">
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-600 dark:hover:bg-orange-700">
                  Start for free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6">
              Welcome to <span className="text-orange-500 dark:text-orange-400">Bakerly</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              The Business Management Platform to Grow your Pastry Business
            </p>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
              Streamline your bakery operations, track inventory, manage recipes, 
              and grow your business with our comprehensive ERP solution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-600 dark:hover:bg-orange-700 px-8 py-6 text-lg">
                  Start for free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 px-8 py-6 text-lg">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white dark:bg-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">About Bakerly</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Bakerly is a powerful business management platform specifically designed for pastry 
              businesses. Whether you run a small home bakery or a growing pastry shop, we help 
              you manage every aspect of your business from one centralized platform.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl bg-orange-50 dark:bg-gray-700">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChefHat className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">For Pastry Professionals</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Designed specifically for bakers and pastry chefs to manage their unique business needs.
              </p>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-orange-50 dark:bg-gray-700">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Easy to Use</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Intuitive interface that requires no technical expertise. Get started in minutes.
              </p>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-orange-50 dark:bg-gray-700">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Grow Your Business</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Analytics and insights to help you make data-driven decisions and scale your business.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Powerful Features</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Everything you need to run your pastry business efficiently
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Inventory Management</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Track all your baking supplies, ingredients, and finished products in real-time.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                <ChefHat className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Recipe Management</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Create and manage recipes with precise measurements and cost calculations.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                <ShoppingCart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Purchase Tracking</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Track supplier orders and manage your purchasing workflow efficiently.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Sales Analytics</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Monitor sales performance with detailed reports and visual dashboards.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Expense Tracking</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Keep track of all business expenses and manage your finances effectively.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Customer Management</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Manage customer information and track service offerings effortlessly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white dark:bg-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Get in Touch</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Have questions? We'd love to hear from you. Reach out to us through any of these channels.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-7 w-7 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Email</h3>
              <p className="text-gray-600 dark:text-gray-300">bakerly.company@gmail.com</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-7 w-7 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Phone</h3>
              <p className="text-gray-600 dark:text-gray-300">0111511805</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-amber-500 dark:from-orange-600 dark:to-amber-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Grow Your Pastry Business?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of bakers who trust Bakerly to manage their business.
          </p>
          <Link to="/signup">
            <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100 dark:bg-gray-100 dark:text-orange-600 dark:hover:bg-white px-8 py-6 text-lg font-semibold">
              Start for free today <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-white/80">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>Indefinite unlimited free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-gray-400 dark:text-gray-500 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <img
                src="/Bakerly Logo.png"
                alt="Bakerly Logo"
                className="h-8 w-8 object-contain"
              />
              <span className="text-lg font-bold text-white">Bakerly</span>
            </div>
            
            <div className="flex gap-8">
              <button 
                onClick={() => scrollToSection('about')}
                className="hover:text-orange-400 dark:hover:text-orange-300 transition-colors"
              >
                About
              </button>
              <button 
                onClick={() => scrollToSection('features')}
                className="hover:text-orange-400 dark:hover:text-orange-300 transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="hover:text-orange-400 dark:hover:text-orange-300 transition-colors"
              >
                Contact
              </button>
            </div>
            
            <p className="text-sm">
              © 2026 Bakerly. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
