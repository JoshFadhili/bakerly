export interface HelpTopic {
  id: string;
  title: string;
  icon: string;
  description: string;
  content: string;
}

export const helpTopics: HelpTopic[] = [
  {
    id: "products-services",
    title: "Products & Services",
    icon: "📦",
    description: "Learn how to add and manage products and services in your ERP system",
    content: `# Products & Services Management

## Adding New Products

To add a new product to your inventory:

1. Navigate to the **Products** page from the sidebar
2. Click the **"Add Product"** button
3. Fill in the product details:
   - **Name**: The product name (required)
   - **SKU**: Stock Keeping Unit - unique identifier (required)
   - **Category**: Select or create a category
   - **Description**: Product details
   - **Cost Price**: The price you paid for the product
   - **Selling Price**: The price customers will pay
   - **Current Stock**: Initial quantity on hand
   - **Reorder Level**: Minimum stock level before reordering
   - **Unit of Measure**: (e.g., pcs, kg, liters)
4. Click **"Save"** to add the product

## Managing Categories

To create product categories:

1. On the Products page, click the **"Manage Categories"** button
2. Click **"Add Category"**
3. Enter the category name
4. Click **"Save"**

Categories help organize your products and make them easier to find.

## Adding Services

Services are intangible offerings you provide to customers:

1. Navigate to the **Products** page
2. Click the **"Add Service"** button
3. Fill in the service details:
   - **Service Name**: Name of the service
   - **Description**: What the service includes
   - **Service Rate**: Price per hour/unit
   - **Category**: Service category
4. Click **"Save"**

## Editing Products/Services

1. Find the product or service in the list
2. Click the **Edit** icon (pencil)
3. Update the information
4. Click **"Save Changes"**

## Deleting Products/Services

1. Find the item in the list
2. Click the **Delete** icon (trash)
3. Confirm the deletion

**Note**: You cannot delete products that have been used in sales or purchases.`
  },
  {
    id: "sales",
    title: "Sales Management",
    icon: "💰",
    description: "Learn how to create sales and record transactions",
    content: `# Sales Management

## Creating a New Sale

To record a new product sale:

1. Click the **"New Sale"** button in the header or navigate to Sales page
2. In the New Sale dialog:
   - **Customer Details**: Enter customer name and contact information
   - **Date**: Sale date (defaults to today)
   - **Products**: Add products to the sale:
     - Search or select a product
     - Enter quantity
     - Adjust price if needed
     - Click **"Add"** to include in sale
   - **Discount**: Apply any discount percentage
   - **Payment Method**: Select (Cash, Card, Mobile Money, etc.)
   - **Payment Status**: Paid, Partial, or Pending
   - **Notes**: Add any relevant notes
3. Review the total amount
4. Click **"Save Sale"** to complete

## Recording Services Offered

To record a service provided to a customer:

1. Click the **"New Service Offered"** button in the header
2. In the New Service Offered dialog:
   - **Customer Details**: Enter customer information
   - **Date**: Service date
   - **Service**: Select the service provided
   - **Quantity**: Hours or units of service
   - **Rate**: Price per unit (auto-filled from service settings)
   - **Total Amount**: Calculated automatically
   - **Payment Method**: How the customer paid
   - **Payment Status**: Payment completion status
   - **Notes**: Service details or observations
3. Click **"Save"** to record

## Viewing Sales History

1. Navigate to the **Sales** page
2. View all sales in a table format
3. Use filters to find specific sales:
   - Date range
   - Customer name
   - Payment status
   - Product/service

## Editing a Sale

1. Find the sale in the Sales page
2. Click the **Edit** icon
3. Update the sale details
4. Click **"Save Changes"**

## Deleting a Sale

1. Find the sale in the list
2. Click the **Delete** icon
3. Confirm the deletion

**Important**: Deleting a sale will reverse inventory changes and financial records.`
  },
  {
    id: "purchases",
    title: "Purchases & Inventory",
    icon: "🛒",
    description: "Learn how to record purchases and manage inventory",
    content: `# Purchases & Inventory Management

## Recording a Purchase

To record a purchase that adds to your inventory:

1. Navigate to the **Purchases** page
2. Click the **"New Purchase"** button
3. Fill in the purchase details:
   - **Supplier Information**: Supplier name and contact details
   - **Purchase Date**: When the purchase was made
   - **Invoice Number**: Reference number from supplier
   - **Products**: Add items purchased:
     - Select product from inventory
     - Enter quantity purchased
     - Enter unit cost
     - Add multiple items as needed
   - **Total Amount**: Calculated automatically
   - **Payment Method**: How you paid the supplier
   - **Payment Status**: Paid, Partial, or Pending
   - **Notes**: Any additional information
4. Click **"Save Purchase"**

The inventory will be automatically updated with the new quantities.

## Viewing Purchases

1. Navigate to the **Purchases** page
2. View all purchases in a table
3. Use filters to find specific purchases:
   - Date range
   - Supplier
   - Payment status

## Managing Inventory

### Viewing Stock Levels

1. Navigate to the **Inventory** page
2. View all products with their current stock levels
3. Products below reorder level are highlighted

### Viewing Batch Details

For products with batch tracking:

1. Click on a product in the Inventory page
2. View batch information including:
   - Batch number
   - Purchase date
   - Quantity
   - Cost
   - Expiry date (if applicable)

### Stock Adjustments

To manually adjust stock:

1. Find the product in Inventory
2. Click **"Adjust Stock"**
3. Enter the new quantity
4. Select adjustment reason (damage, loss, correction, etc.)
5. Add notes
6. Click **"Save"**

## Low Stock Alerts

The system automatically alerts you when products fall below their reorder level:
- Check the Dashboard for low stock notifications
- Review the Inventory page for highlighted items
- Create purchase orders to replenish stock

## Editing a Purchase

1. Find the purchase in the Purchases page
2. Click the **Edit** icon
3. Update the details
4. Click **"Save Changes"**

**Note**: Editing a purchase will adjust inventory accordingly.`
  },
  {
    id: "expenses",
    title: "Expenses Management",
    icon: "💸",
    description: "Learn how to track and manage business expenses",
    content: `# Expenses Management

## Adding an Expense

To record a business expense:

1. Navigate to the **Expenses** page
2. Click the **"Add Expense"** button
3. Fill in the expense details:
   - **Date**: When the expense occurred
   - **Category**: Select expense category:
     - Rent
     - Utilities
     - Salaries
     - Marketing
     - Transportation
     - Supplies
     - Maintenance
     - Insurance
     - Taxes
     - Other
   - **Amount**: The expense amount
   - **Description**: Details about the expense
   - **Payment Method**: How the expense was paid
   - **Vendor/Supplier**: Who the expense was paid to
   - **Reference**: Invoice or receipt number
   - **Notes**: Additional information
4. Click **"Save Expense"**

## Viewing Expenses

1. Navigate to the **Expenses** page
2. View all expenses in a table format
3. Use filters to find specific expenses:
   - Date range
   - Category
   - Amount range
   - Payment method

## Editing an Expense

1. Find the expense in the Expenses page
2. Click the **Edit** icon
3. Update the expense details
4. Click **"Save Changes"**

## Deleting an Expense

1. Find the expense in the list
2. Click the **Delete** icon
3. Confirm the deletion

## Expense Categories

Categories help organize and analyze your expenses:

- **Rent**: Office or store rent
- **Utilities**: Electricity, water, internet
- **Salaries**: Employee wages and salaries
- **Marketing**: Advertising and promotional costs
- **Transportation**: Fuel, delivery, travel
- **Supplies**: Office supplies, inventory supplies
- **Maintenance**: Repairs and maintenance
- **Insurance**: Business insurance premiums
- **Taxes**: Tax payments
- **Other**: Miscellaneous expenses

## Expense Tracking Tips

- Record expenses regularly for accurate tracking
- Use consistent categories for better reporting
- Keep receipts and reference numbers
- Review expenses monthly to identify cost-saving opportunities`
  },
  {
    id: "finance",
    title: "Finance Management",
    icon: "📊",
    description: "Learn how to manage finances and view financial reports",
    content: `# Finance Management

## Overview

The Finance module provides comprehensive financial tracking and reporting for your business.

## Viewing Financial Dashboard

1. Navigate to the **Finance** page
2. View key financial metrics:
   - **Total Revenue**: Income from sales and services
   - **Total Expenses**: All business expenses
   - **Net Profit**: Revenue minus expenses
   - **Cash Flow**: Money in and out
   - **Accounts Receivable**: Money owed by customers
   - **Accounts Payable**: Money owed to suppliers

## Revenue Tracking

Revenue is automatically calculated from:
- Product sales
- Services offered
- Other income sources

View revenue breakdown by:
- Time period (daily, weekly, monthly, yearly)
- Product/service type
- Customer
- Payment method

## Expense Tracking

All recorded expenses are summarized in the Finance module:
- View total expenses by category
- Track expense trends over time
- Identify major cost centers

## Profit & Loss Statement

Generate a Profit & Loss report:

1. Navigate to the **Finance** page
2. Select the desired date range
3. View the P&L statement showing:
   - Gross Revenue
   - Cost of Goods Sold
   - Gross Profit
   - Operating Expenses
   - Net Profit

## Cash Flow Management

Track your cash position:

1. View cash flow summary
2. See money coming in (inflows):
   - Cash sales
   - Customer payments
   - Other income
3. See money going out (outflows):
   - Supplier payments
   - Expense payments
   - Other outflows

## Financial Reports

Access various financial reports:

### Revenue Reports
- Sales by period
- Revenue by product/service
- Revenue by customer
- Revenue by payment method

### Expense Reports
- Expenses by category
- Expense trends
- Vendor expenses

### Profit Reports
- Monthly profit
- Quarterly profit
- Yearly profit

## Financial Settings

Configure finance settings:

1. Navigate to **Settings** > **Finance**
2. Set up:
   - Currency
   - Tax rates
   - Payment terms
   - Fiscal year start
   - Accounting method

## Tips for Effective Financial Management

- Review financial reports regularly (monthly recommended)
- Track expenses consistently
- Monitor cash flow to avoid liquidity issues
- Compare actual vs. budgeted performance
- Use financial insights to make informed business decisions`
  },
  {
    id: "reports",
    title: "Reports & Analytics",
    icon: "📈",
    description: "Learn how to generate and export reports",
    content: `# Reports & Analytics

## Overview

The Reports module provides comprehensive analytics and reporting capabilities to help you understand your business performance.

## Accessing Reports

1. Navigate to the **Reports** page
2. Select the type of report you want to generate

## Available Report Types

### Sales Reports

**Sales Summary Report**
- Total sales over a period
- Breakdown by product/service
- Sales trends

**Sales by Customer Report**
- Top customers by revenue
- Customer purchase frequency
- Customer lifetime value

**Sales by Product Report**
- Best-selling products
- Product performance trends
- Inventory turnover

### Inventory Reports

**Stock Level Report**
- Current inventory levels
- Low stock items
- Overstock items

**Inventory Valuation Report**
- Total inventory value
- Value by product category
- Cost vs. selling value

**Batch Report**
- Batch details
- Expiry tracking
- Purchase history

### Purchase Reports

**Purchase Summary Report**
- Total purchases by period
- Supplier analysis
- Cost trends

**Supplier Performance Report**
- Orders by supplier
- Supplier reliability
- Cost comparison

### Financial Reports

**Revenue Report**
- Revenue by period
- Revenue by category
- Revenue trends

**Expense Report**
- Expenses by category
- Expense trends
- Cost analysis

**Profit & Loss Report**
- Income statement
- Gross profit
- Net profit

**Cash Flow Report**
- Cash inflows
- Cash outflows
- Net cash position

### Customer Reports

**Customer Activity Report**
- Customer list
- Purchase history
- Last purchase date

**Customer Analytics**
- Customer acquisition
- Retention rates
- Average order value

## Generating Reports

1. Select the report type
2. Choose the date range:
   - Today
   - This Week
   - This Month
   - This Quarter
   - This Year
   - Custom Range
3. Apply filters as needed:
   - Product/Service
   - Category
   - Customer
   - Supplier
   - Payment Method
4. Click **"Generate Report"**

## Exporting Reports

### Export Options

Reports can be exported in multiple formats:

**CSV Export**
- Compatible with Excel, Google Sheets
- Best for data analysis
- File size: Small

**PDF Export**
- Professional presentation
- Best for sharing and printing
- File size: Medium

**Excel Export**
- Full formatting preserved
- Best for further editing
- File size: Medium

### How to Export

1. Generate the report you want
2. Click the **"Export"** button
3. Select the desired format (CSV, PDF, Excel)
4. The file will download automatically

## Report Scheduling (Future Feature)

Soon you'll be able to:
- Schedule automatic report generation
- Set up email delivery
- Create custom report templates

## Dashboard Analytics

The Dashboard provides real-time analytics:

### Key Performance Indicators (KPIs)
- Total Revenue
- Total Sales
- Average Order Value
- Total Expenses
- Net Profit
- Low Stock Count

### Sales Chart
- Visual sales trend over time
- Compare periods
- Identify patterns

### Top Products
- Best-selling products
- Revenue by product
- Quantity sold

### Recent Activities
- Latest sales
- Recent purchases
- Recent expenses
- Recent inventory changes

## Tips for Effective Reporting

- Generate reports regularly (weekly/monthly)
- Compare periods to identify trends
- Use multiple report types for comprehensive insights
- Export reports for offline analysis
- Share reports with stakeholders
- Use insights to make data-driven decisions`
  },
  {
    id: "dashboard",
    title: "Dashboard Overview",
    icon: "🏠",
    description: "Learn about the dashboard and its features",
    content: `# Dashboard Overview

## Introduction

The Dashboard is your business command center, providing a real-time overview of your business performance and quick access to key functions.

## Dashboard Sections

### Key Performance Indicators (KPIs)

The top section displays critical business metrics:

- **Total Revenue**: Income from sales and services in the selected period
- **Total Sales**: Number of sales transactions completed
- **Total Expenses**: Sum of all recorded expenses
- **Net Profit**: Revenue minus expenses
- **Low Stock Items**: Count of products below reorder level
- **Pending Payments**: Amount of unpaid invoices

### Sales Chart

Visual representation of your sales performance:
- Shows sales trends over time
- Compare different periods
- Identify seasonal patterns
- Spot growth or decline trends

### Top Products

Displays your best-performing products:
- Product name and image
- Quantity sold
- Revenue generated
- Click to view product details

### Recent Activities

Timeline of recent business activities:
- Sales completed
- Purchases recorded
- Expenses added
- Inventory changes
- Services offered

### Quick Actions

Fast access to common tasks:
- **New Sale**: Create a new product sale
- **New Service**: Record a service offered
- **Add Expense**: Record a business expense
- **Add Product**: Add a new product to inventory

## Navigation

Use the sidebar to navigate to different modules:
- **Dashboard**: Overview and quick actions
- **Sales**: Sales management and history
- **Purchases**: Purchase recording and history
- **Inventory**: Stock management
- **Products**: Product and service catalog
- **Expenses**: Expense tracking
- **Finance**: Financial reports and analytics
- **Reports**: Comprehensive reporting
- **Settings**: System configuration

## Notifications

Stay informed with real-time notifications:
- Click the bell icon in the header
- View:
  - Low stock alerts
  - Payment reminders
  - System notifications
  - Important updates

## Theme Toggle

Switch between light and dark mode:
- Click the moon/sun icon in the header
- Your preference is saved automatically

## User Account

Access your account settings:
- Click your avatar in the header
- View profile information
- Navigate to Settings
- Log out

## Dashboard Tips

- Check the dashboard daily for business overview
- Pay attention to low stock alerts
- Review sales trends regularly
- Use quick actions for efficiency
- Monitor KPIs to track performance
- Set goals based on dashboard insights`
  },
  {
    id: "settings",
    title: "Settings & Configuration",
    icon: "⚙️",
    description: "Learn how to configure system settings",
    content: `# Settings & Configuration

## Overview

The Settings module allows you to configure the ERP system to match your business needs.

## Accessing Settings

1. Click your avatar in the header
2. Select **"Settings"** from the dropdown
3. Or navigate directly from the sidebar

## Settings Categories

### Business Settings

Configure your business information:
- **Business Name**: Your company name
- **Business Type**: Retail, Service, Manufacturing, etc.
- **Contact Information**: Phone, email, address
- **Tax ID**: Business tax identification number
- **Currency**: Default currency for transactions

### Finance Settings

Configure financial settings:
- **Currency Symbol**: $, €, £, etc.
- **Tax Rate**: Default tax percentage
- **Payment Terms**: Default payment terms for customers
- **Fiscal Year Start**: Month when your fiscal year begins
- **Accounting Method**: Cash or accrual basis

### Inventory Settings

Configure inventory management:
- **Default Reorder Level**: Default minimum stock level
- **Low Stock Alert Threshold**: When to alert about low stock
- **Batch Tracking**: Enable/disable batch tracking
- **Expiry Tracking**: Enable/disable expiry date tracking
- **Stock Valuation Method**: FIFO, LIFO, or Average Cost

### Sales Settings

Configure sales options:
- **Default Payment Method**: Most common payment method
- **Require Customer Info**: Make customer details mandatory
- **Allow Discounts**: Enable discount functionality
- **Maximum Discount Percentage**: Limit discount amounts
- **Invoice Prefix**: Prefix for invoice numbers
- **Auto-increment Invoice**: Automatic invoice numbering

### Purchase Settings

Configure purchase options:
- **Default Payment Terms**: Terms for suppliers
- **Require Supplier Info**: Make supplier details mandatory
- **Purchase Order Prefix**: Prefix for PO numbers
- **Auto-increment PO**: Automatic PO numbering

### Expense Settings

Configure expense tracking:
- **Require Receipt**: Make receipt number mandatory
- **Default Category**: Default expense category
- **Approval Required**: Require approval for expenses above threshold
- **Approval Threshold**: Amount requiring approval

### Notification Settings

Configure system notifications:
- **Email Notifications**: Enable/disable email alerts
- **Low Stock Alerts**: Notify when stock is low
- **Payment Reminders**: Remind about pending payments
- **Daily Summary**: Receive daily business summary
- **Weekly Summary**: Receive weekly business summary

### Display Settings

Configure appearance:
- **Theme**: Light or dark mode
- **Date Format**: Preferred date display format
- **Number Format**: How numbers are displayed
- **Language**: System language

### Security Settings

Configure security options:
- **Password Policy**: Password requirements
- **Session Timeout**: Auto-logout after inactivity
- **Two-Factor Authentication**: Enable 2FA
- **Audit Logging**: Track user activities

### Backup Settings

Configure data backup:
- **Auto Backup Frequency**: How often to backup
- **Backup Retention**: How long to keep backups
- **Backup Location**: Where backups are stored
- **Manual Backup**: Trigger backup now

### Integration Settings

Configure third-party integrations:
- **Payment Gateways**: Connect payment processors
- **Email Service**: Configure email sending
- **SMS Service**: Configure SMS notifications
- **Accounting Software**: Connect to accounting systems

## Saving Settings

1. Make changes to any setting
2. Click **"Save Changes"** at the bottom
3. Settings are applied immediately

## Resetting Settings

To reset settings to default:
1. Navigate to the settings category
2. Click **"Reset to Default"**
3. Confirm the reset

## Tips for Settings Configuration

- Configure business settings first
- Set up finance settings before recording transactions
- Customize inventory settings based on your products
- Enable notifications for important alerts
- Review settings periodically as your business grows
- Backup your settings after major changes`
  },
  {
    id: "export-import",
    title: "Export & Import",
    icon: "📥",
    description: "Learn how to export data and import information",
    content: `# Export & Import Data

## Overview

The ERP system allows you to export data for analysis, reporting, and backup purposes. You can also import data to bulk-add information.

## Exporting Data

### Exporting Reports

Most pages and reports support export functionality:

1. Navigate to the page or generate the report
2. Look for the **"Export"** button
3. Select your preferred format:
   - **CSV**: Comma-separated values, compatible with Excel
   - **PDF**: Portable Document Format, for sharing/printing
   - **Excel**: Native Excel format with formatting
4. The file will download automatically

### Export Options by Module

#### Sales Export
- Export all sales or filtered results
- Include customer details
- Include payment information
- Choose date range

#### Purchases Export
- Export all purchases or filtered results
- Include supplier details
- Include product information
- Choose date range

#### Inventory Export
- Export current stock levels
- Include product details
- Include batch information
- Include valuation data

#### Expenses Export
- Export all expenses or filtered results
- Include category breakdown
- Include payment details
- Choose date range

#### Financial Reports Export
- Export P&L statements
- Export cash flow reports
- Export balance sheets
- Choose reporting period

### Export Best Practices

- Use CSV for data analysis in spreadsheets
- Use PDF for sharing with stakeholders
- Use Excel for further editing and formatting
- Include relevant filters before exporting
- Choose appropriate date ranges
- Name exports descriptively for easy identification

## Importing Data

### Supported Import Formats

- **CSV**: Comma-separated values
- **Excel**: .xlsx files
- **JSON**: For technical users

### Importing Products

To bulk import products:

1. Prepare your data in CSV or Excel format with columns:
   - Name (required)
   - SKU (required)
   - Category
   - Description
   - Cost Price
   - Selling Price
   - Current Stock
   - Reorder Level
   - Unit of Measure
2. Navigate to **Products** page
3. Click **"Import Products"**
4. Select your file
5. Map columns if needed
6. Review import preview
7. Click **"Import"** to complete

### Importing Customers

To bulk import customers:

1. Prepare CSV/Excel with columns:
   - Name (required)
   - Email
   - Phone
   - Address
2. Navigate to **Sales** or **Finance** page
3. Click **"Import Customers"**
4. Select file and map columns
5. Review and import

### Importing Suppliers

To bulk import suppliers:

1. Prepare CSV/Excel with columns:
   - Name (required)
   - Contact Person
   - Email
   - Phone
   - Address
2. Navigate to **Purchases** page
3. Click **"Import Suppliers"**
4. Select file and map columns
5. Review and import

### Importing Expenses

To bulk import expenses:

1. Prepare CSV/Excel with columns:
   - Date (required)
   - Category (required)
   - Amount (required)
   - Description
   - Payment Method
   - Vendor/Supplier
   - Reference
2. Navigate to **Expenses** page
3. Click **"Import Expenses"**
4. Select file and map columns
5. Review and import

## Import Validation

The system validates imported data:
- Required fields must be present
- Data types must match (numbers for amounts)
- Dates must be valid
- Duplicate entries are flagged
- Invalid data is highlighted

## Import Error Handling

If errors occur during import:
1. Review the error report
2. Fix the issues in your source file
3. Re-import the corrected file
4. Successful imports are applied immediately

## Backup and Restore

### Creating a Backup

1. Navigate to **Settings** > **Backup**
2. Click **"Create Backup"**
3. Wait for backup to complete
4. Download the backup file

### Restoring from Backup

**Warning**: Restoring from backup will overwrite current data.

1. Navigate to **Settings** > **Backup**
2. Click **"Restore Backup"**
3. Select your backup file
4. Confirm the restore operation
5. Wait for restore to complete

## Data Export Tips

- Regularly export important data for backup
- Use consistent naming conventions
- Store exports in organized folders
- Keep historical exports for trend analysis
- Verify exported data for accuracy

## Data Import Tips

- Validate data before importing
- Use templates if available
- Test with small batches first
- Keep original files as backup
- Review import results carefully
- Fix errors before proceeding`
  }
];
