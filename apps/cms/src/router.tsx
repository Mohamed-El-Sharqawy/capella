import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthGuard } from "./components/auth/auth-guard";
import { DashboardLayout } from "./components/layout/dashboard-layout";
import { DashboardPage } from "./pages/dashboard";
import { ProductsPage, NewProductPage, EditProductPage, ViewProductPage } from "./pages/products";
import { CollectionsPage } from "./pages/collections";
import { CollectionDetailsPage } from "./pages/collection-details";
import { ColorsPage } from "./pages/colors";
import { SizesPage } from "./pages/sizes";
import { OrdersPage } from "./pages/orders";
import { UsersPage } from "./pages/users";
import { UserDetailsPage } from "./pages/user-details";
import { CouponsPage } from "./pages/coupons";
import { ContentPage } from "./pages/content";
import { BannersPage } from "./pages/banners";
import { ReviewsPage } from "./pages/reviews";
import { AnalyticsPage } from "./pages/analytics";
import { LoginPage } from "./pages/login";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <AuthGuard>
        <DashboardLayout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "products",
        element: <ProductsPage />,
      },
      {
        path: "products/new",
        element: <NewProductPage />,
      },
      {
        path: "products/:slug",
        element: <ViewProductPage />,
      },
      {
        path: "products/:slug/edit",
        element: <EditProductPage />,
      },
      {
        path: "collections",
        element: <CollectionsPage />,
      },
      {
        path: "collections/:id",
        element: <CollectionDetailsPage />,
      },
      {
        path: "colors",
        element: <ColorsPage />,
      },
      {
        path: "sizes",
        element: <SizesPage />,
      },
      {
        path: "orders",
        element: <OrdersPage />,
      },
      {
        path: "users",
        element: <UsersPage />,
      },
      {
        path: "users/:id",
        element: <UserDetailsPage />,
      },
      {
        path: "coupons",
        element: <CouponsPage />,
      },
      {
        path: "content",
        element: <ContentPage />,
      },
      {
        path: "banners",
        element: <BannersPage />,
      },
      {
        path: "reviews",
        element: <ReviewsPage />,
      },
      {
        path: "analytics",
        element: <AnalyticsPage />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
