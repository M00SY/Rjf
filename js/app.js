$(document).ready(() => {
  $(".main-loader").css("display", "none");
  $("body").css("overflow", "auto");
});

class Customer {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }
}

class Transaction {
  constructor(id, customerId, date, amount) {
    this.id = id;
    this.customerId = customerId;
    this.date = date;
    this.amount = amount;
  }
}

class DataService {
  constructor() {
    this.customers = [];
    this.transactions = [];
  }

  async fetchData() {
    const fallbackData = {
      "customers": [
        { "id": 1, "name": "Ahmed Ali" },
        { "id": 2, "name": "Aya Elsayed" },
        { "id": 3, "name": "Mina Adel" },
        { "id": 4, "name": "Sarah Reda" },
        { "id": 5, "name": "Mohamed Sayed" }
      ],
      "transactions": [
        { "id": 1, "customer_id": 1, "date": "2022-01-01", "amount": 1000 },
        { "id": 2, "customer_id": 1, "date": "2022-01-02", "amount": 2000 },
        { "id": 3, "customer_id": 2, "date": "2022-01-01", "amount": 550 },
        { "id": 4, "customer_id": 3, "date": "2022-01-01", "amount": 500 },
        { "id": 5, "customer_id": 2, "date": "2022-01-02", "amount": 1300 },
        { "id": 6, "customer_id": 4, "date": "2022-01-01", "amount": 750 },
        { "id": 7, "customer_id": 3, "date": "2022-01-02", "amount": 1250 },
        { "id": 8, "customer_id": 5, "date": "2022-01-01", "amount": 2500 },
        { "id": 9, "customer_id": 5, "date": "2022-01-02", "amount": 875 }
      ]
    };
  
    try {
      const response = await fetch('https://6694c0494bd61d8314c87470.mockapi.io/api/Data/transactions');
      const data = await response.json();
  
      console.log('Fetched data:', data);
      
      if (!Array.isArray(data.customers) || !Array.isArray(data.transactions)) {
        throw new Error('Invalid API response structure');
      }
  
      this.customers = data.customers.map(({ id, name }) => new Customer(id, name));
      this.transactions = data.transactions.map(({ id, customer_id, date, amount }) => new Transaction(id, customer_id, date, amount));
    } catch (error) {
      console.error('Error fetching data:', error);
      this.customers = fallbackData.customers.map(({ id, name }) => new Customer(id, name));
      this.transactions = fallbackData.transactions.map(({ id, customer_id, date, amount }) => new Transaction(id, customer_id, date, amount));
    }
  }
  
  filterTransactionsByCustomerId(customerId) {
    return this.transactions.filter(transaction => transaction.customerId === customerId);
  }

  filterTransactions(searchTerm) {
    searchTerm = searchTerm.toLowerCase();
    return this.transactions.filter(transaction => {
      const customer = this.customers.find(c => c.id === transaction.customerId);
      return customer.name.toLowerCase().includes(searchTerm) || transaction.amount.toString().includes(searchTerm);
    });
  }

  groupTransactionsByDate(transactions) {
    return transactions.reduce((acc, transaction) => {
      if (!acc[transaction.date]) {
        acc[transaction.date] = [];
      }
      acc[transaction.date].push(transaction);
      return acc;
    }, {});
  }
}

class UI {
  constructor(dataService) {
    this.dataService = dataService;
    this.transactionsTable = $('#transactionsTable');
    this.transactionsBody = $('#transactionsBody');
    this.filterInput = $('#filterInput');
    this.ctx = $('#transactionChart')[0].getContext('2d');
    this.backButton = $('#backButton'); 

    this.setupEventListeners();
  }

  async init() {
    await this.dataService.fetchData();
    this.displayTransactions(this.dataService.transactions);
    this.updateChart(this.dataService.transactions);
  }

  setupEventListeners() {
    this.filterInput.on('input', () => {
      const searchTerm = this.filterInput.val().trim();
      const filteredTransactions = this.dataService.filterTransactions(searchTerm);
      this.displayTransactions(filteredTransactions);
      this.updateChart(filteredTransactions);
    });

    this.backButton.on('click', () => {
      this.displayTransactions(this.dataService.transactions);
      this.updateChart(this.dataService.transactions);
      this.backButton.hide(); 
    });
  }

  handleCustomerNameClick(customerId) {
    const customerTransactions = this.dataService.filterTransactionsByCustomerId(customerId);
    this.displayTransactions(customerTransactions);
    this.updateChart(customerTransactions);
    this.backButton.show();
  }

  displayTransactions(transactions) {
    this.transactionsBody.empty();
    transactions.forEach(({ customerId, date, amount }) => {
      const customer = this.dataService.customers.find(c => c.id === customerId);
      const row = `
        <tr>
          <td><a href="#" class="customer-name" data-customer-id="${customer.id}">${customer.name}</a></td>
          <td>${date}</td>
          <td>${amount}</td>
        </tr>
      `;
      this.transactionsBody.append(row);
    });

    $('.customer-name').on('click', (event) => {
      event.preventDefault();
      const customerId = $(event.target).data('customer-id');
      this.handleCustomerNameClick(customerId);
    });
  }

  updateChart(transactions) {
    const groupedByDate = this.dataService.groupTransactionsByDate(transactions);

    const dates = Object.keys(groupedByDate);
    const amounts = dates.map(date => groupedByDate[date].reduce((acc, { amount }) => acc + amount, 0));

    if (window.myChart) {
      window.myChart.destroy();
    }

    window.myChart = new Chart(this.ctx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Total Transaction Amount',
          data: amounts,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: (context) => `Amount: ${context.parsed.y}`
            }
          }
        },
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
}

const dataService = new DataService();
const ui = new UI(dataService);

$(document).ready(() => {
  ui.init();
});
