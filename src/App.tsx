import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SaleDialogProvider } from "@/contexts/SaleDialogContext";
import { ServiceOfferedDialogProvider } from "@/contexts/ServiceOfferedDialogContext";
import { PurchaseDialogProvider } from "@/contexts/PurchaseDialogContext";
import { RecipeDialogProvider } from "@/contexts/RecipeDialogContext";
import { BakingSupplyPurchaseDialogProvider } from "@/contexts/BakingSupplyPurchaseDialogContext";
import { ExpenseDialogProvider } from "@/contexts/ExpenseDialogContext";
import { HelpDialogProvider } from "@/contexts/HelpDialogContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Purchases from "./pages/Purchases";
import FinishedProducts from "./pages/FinishedProducts";
import Recipes from "./pages/Recipes";
import Expenses from "./pages/Expenses";
import Finance from "./pages/Finance";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { HelpDialog } from "@/components/help/HelpDialog";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          <NotificationProvider>
            <SaleDialogProvider>
              <ServiceOfferedDialogProvider>
                <PurchaseDialogProvider>
                  <RecipeDialogProvider>
                    <BakingSupplyPurchaseDialogProvider>
                      <ExpenseDialogProvider>
                    <HelpDialogProvider>
                      <TooltipProvider>
                        <Toaster />
                        <Sonner />
                        <HelpDialog />
                        <BrowserRouter>
                          <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/" element={
                              <ProtectedRoute>
                                <Dashboard />
                              </ProtectedRoute>
                            } />
                            <Route path="/sales" element={
                              <ProtectedRoute>
                                <Sales />
                              </ProtectedRoute>
                            } />
                            <Route path="/products" element={
                              <ProtectedRoute>
                                <Products />
                              </ProtectedRoute>
                            } />
                            <Route path="/inventory" element={
                              <ProtectedRoute>
                                <Inventory />
                              </ProtectedRoute>
                            } />
                            <Route path="/purchases" element={
                              <ProtectedRoute>
                                <Purchases />
                              </ProtectedRoute>
                            } />
                            <Route path="/finished-products" element={
                              <ProtectedRoute>
                                <FinishedProducts />
                              </ProtectedRoute>
                            } />
                            <Route path="/recipes" element={
                              <ProtectedRoute>
                                <Recipes />
                              </ProtectedRoute>
                            } />
                            <Route path="/expenses" element={
                              <ProtectedRoute>
                                <Expenses />
                              </ProtectedRoute>
                            } />
                            <Route path="/finance" element={
                              <ProtectedRoute>
                                <Finance />
                              </ProtectedRoute>
                            } />
                            <Route path="/reports" element={
                              <ProtectedRoute>
                                <Reports />
                              </ProtectedRoute>
                            } />
                            <Route path="/settings" element={
                              <ProtectedRoute>
                                <Settings />
                              </ProtectedRoute>
                            } />
                            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </BrowserRouter>
                      </TooltipProvider>
                    </HelpDialogProvider>
                    </ExpenseDialogProvider>
                  </BakingSupplyPurchaseDialogProvider>
                </RecipeDialogProvider>
              </PurchaseDialogProvider>
            </ServiceOfferedDialogProvider>
          </SaleDialogProvider>
          </NotificationProvider>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
