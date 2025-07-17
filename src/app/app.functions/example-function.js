const axios = require("axios");

exports.main = async (context = {}) => {
  console.log("🔹 Serverless function triggered with context:", context);

  const contactId = context.parameters?.contactId;

  if (!contactId) {
    return {
      statusCode: 400,
      body: "Missing contactId parameter.",
    };
  }

  const HUBSPOT_API_URL = "https://api.hubapi.com";
  const token = process.env.HUBSPOT_PRIVATE_TOKEN;
  const customObjectType = "2-46785961";

  try {
    // Fetch associations between contact and order histories
    const assocResp = await axios.get(
      `${HUBSPOT_API_URL}/crm/v3/objects/contacts/${contactId}/associations/${customObjectType}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("🔸 Associations response:", assocResp.data);

    const orderIds = assocResp.data.results?.map((r) => r.id) || [];

    if (orderIds.length === 0) {
      console.log("ℹ️ No order associations found.");
      return {
        statusCode: 200,
        body: JSON.stringify([]),
      };
    }

    // Batch fetch properties
    const BATCH_SIZE = 100;
    const orders = [];

    for (let i = 0; i < orderIds.length; i += BATCH_SIZE) {
      const batch = orderIds.slice(i, i + BATCH_SIZE);

      const batchResp = await axios.post(
        `${HUBSPOT_API_URL}/crm/v3/objects/${customObjectType}/batch/read`,
        {
          properties: [
            "customer_name",
            "hpl_id",
            "order_num",
            "channel",
            "date",
            "fulfillment",
            "hubspot_id",
            "product_name",
            "qty",
            "sales_price",
            "sku",
            "total",
          ],
          inputs: batch.map((id) => ({ id })),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const batchOrders = batchResp.data.results.map((order) => {
        const props = order.properties;
        return {
          customerName: props.customer_name || "",
          hplId: props.hpl_id || "",
          orderNum: props.order_num || "",
          channel: props.channel || "",
          date: props.date || "",
          fulfillment: props.fulfillment || "",
          hubspotId: props.hubspot_id || "",
          productName: props.product_name || "",
          qty: props.qty || "",
          salesPrice: props.sales_price || "",
          sku: props.sku || "",
          total: props.total || "",
        };
      });

      orders.push(...batchOrders);
    }

    console.log(` Returning ${orders.length} order(s).`);
    return {
      statusCode: 200,
      body: JSON.stringify(orders),
    };
  } catch (err) {
    console.error(" Serverless error:", err.response?.data || err);
    return {
      statusCode: 500,
      body: "Failed to fetch order history",
    };
  }
};
