const axios = require("axios");

exports.main = async (context = {}) => {
  console.log("Example card serverless function triggered. context:", context);

  // Instead of text, read contactId
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

    console.log("Associations response:", assocResp.data);

    const orderIds = assocResp.data.results.map((r) => r.id);

    const orders = [];

    for (const id of orderIds) {
      const orderResp = await axios.get(
        `${HUBSPOT_API_URL}/crm/v3/objects/${customObjectType}/${id}?properties=customer_name,hpl_id,order_num,channel,date,fulfillment,hubspot_id,product_name,qty,sales_price,sku,total`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("orderResp", orderResp.data);
      const props = orderResp.data.properties;

      orders.push({
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
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify(orders),
    };
  } catch (err) {
    console.error("Serverless error:", err.response?.data || err);
    return {
      statusCode: 500,
      body: "Failed to fetch order history",
    };
  }
};
