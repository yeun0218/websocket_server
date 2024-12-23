// customer.controller.js
import db from "../utils/db.js";

const customerController = {
    getCustomerById: async (customerTel) => {
        const [rows] = await db.query("SELECT * FROM customer WHERE customer_tel = ?", [customerTel]);
        if (rows.length === 0) {
            throw new Error(`Customer with ID ${customerTel} not found`);
        }
        return rows[0];
    },

    saveCustomer: async (customerData) => {
        const { name, email, phone } = customerData;
        const [result] = await db.query(
            "INSERT INTO customer (name, email, tel) VALUES (?, ?, ?)",
            [name, email, phone]
        );
        return { id: result.insertId, name, email, phone };
    },

    getAllCustomers: async () => {
        const [rows] = await db.query("SELECT * FROM customer");
        return rows;
    }
};

export default customerController;  // 하나의 객체로 default export
