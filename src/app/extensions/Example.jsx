import React, { useState, useEffect, useMemo } from "react";
import {
  Divider,
  Text,
  Input,
  Flex,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  hubspot,
} from "@hubspot/ui-extensions";

hubspot.extend(({ context, runServerlessFunction, actions }) => (
  <Extension
    context={context}
    runServerless={runServerlessFunction}
    sendAlert={actions.addAlert}
  />
));

const Extension = ({ context, runServerless, sendAlert }) => {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [loading, setLoading] = useState(true); //  loading state

  const fetchOrders = async () => {
    setLoading(true); //  start loading
    try {
      const result = await runServerless({
        name: "myFunc",
        parameters: {
          contactId: context.crm?.objectId,
        },
      });

      if (!result || !result.response) {
        sendAlert({
          type: "error",
          message: `No response received from serverless function.`,
        });
        return;
      }

      const { response } = result;

      if (response.statusCode !== 200) {
        sendAlert({
          type: "error",
          message: `Error fetching orders: ${response.body}`,
        });
        return;
      }

      const ordersArray = JSON.parse(response.body);
      setOrders(ordersArray);
    } catch (e) {
      console.error(" Failed to run serverless:", e);
      sendAlert({
        type: "error",
        message: `Failed to run serverless. Full error:\n${
          e?.message || JSON.stringify(e)
        }`,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSearch = (value) => {
    setSearch(value);
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const displayedOrders = useMemo(() => {
    let result = [...orders];

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter((order) =>
        Object.values(order).some((field) =>
          String(field).toLowerCase().includes(lower)
        )
      );
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key] ?? "";
        const valB = b[sortConfig.key] ?? "";

        const isNumeric = !isNaN(parseFloat(valA)) && !isNaN(parseFloat(valB));

        if (isNumeric) {
          return sortConfig.direction === "asc"
            ? parseFloat(valA) - parseFloat(valB)
            : parseFloat(valB) - parseFloat(valA);
        }

        return sortConfig.direction === "asc"
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return result;
  }, [orders, search, sortConfig]);

  const renderSortIndicator = (key) => {
    if (sortConfig.key !== key) return "⇅";
    return sortConfig.direction === "asc" ? "▲" : "▼";
  };

  const SortableHeaderCell = ({ label, sortKey, width }) => (
    <TableCell style={{ width }}>
      <Flex
        style={{
          minWidth: 0,
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        <Button
          onClick={() => handleSort(sortKey)}
          variant="primary"
          size="md"
          style={{
            width: "100%",
            justifyContent: "center",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontWeight: "bold",
          }}
          aria-sort={
            sortConfig.key === sortKey
              ? sortConfig.direction === "asc"
                ? "ascending"
                : "descending"
              : "none"
          }
        >
          {label} {renderSortIndicator(sortKey)}
        </Button>
      </Flex>
    </TableCell>
  );

  const DataCell = ({ children, width }) => (
    <TableCell style={{ width }}>
      <Flex
        style={{
          minWidth: 0,
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: width,
        }}
      >
        <Text
          style={{
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {children}
        </Text>
      </Flex>
    </TableCell>
  );

  const NumericCell = ({ children, width }) => (
    <TableCell style={{ width }}>
      <Flex
        style={{
          minWidth: 0,
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: width,
        }}
      >
        <Text
          style={{
            fontSize: "12px",
            fontFamily: "monospace",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {children}
        </Text>
      </Flex>
    </TableCell>
  );

  const MultiLineDataCell = ({ children, width }) => (
    <TableCell style={{ width }}>
      <Flex
        style={{
          minWidth: 0,
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
          maxWidth: width,
        }}
      >
        <Text
          style={{
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 5,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {children}
        </Text>
      </Flex>
    </TableCell>
  );

  const grandTotal = useMemo(() => {
    return displayedOrders.reduce((sum, order) => {
      const val = parseFloat(order.total);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }, [displayedOrders]);

  return (
    <>
      <Flex
        direction="row"
        align="end"
        gap="small"
        style={{ marginTop: "8px" }}
      >
        <Input
          name="search"
          value={search}
          onInput={handleSearch}
          placeholder="Search Histories"
        />
        <Flex
          justify="center"
          align="center"
          style={{
            marginTop: "12px",
            marginBottom: "8px",
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          <Button variant="transparent" size="lg">
            Total Sales: $
            {grandTotal.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Button>
        </Flex>
      </Flex>

      <Divider />

      {loading ? (
        <Text>Loading orders...</Text>
      ) : displayedOrders.length > 0 ? (
        <Flex style={{ overflowX: "auto" }}>
          <Table style={{ tableLayout: "fixed", width: "1200" }}>
            <TableHead>
              <TableRow>
                <SortableHeaderCell label="Date" sortKey="date" width="100px" />
                <SortableHeaderCell label="SKU" sortKey="sku" width="100px" />
                <SortableHeaderCell
                  label="Product Name"
                  sortKey="productName"
                  width="220px"
                />
                <SortableHeaderCell label="Qty" sortKey="qty" width="80px" />
                <SortableHeaderCell
                  label="Sales $$"
                  sortKey="salesPrice"
                  width="100px"
                />
                <SortableHeaderCell
                  label="Total $$"
                  sortKey="total"
                  width="140px"
                />
                <SortableHeaderCell
                  label="Fulfillment"
                  sortKey="fulfillment"
                  width="140px"
                />
                <SortableHeaderCell
                  label="Channel"
                  sortKey="channel"
                  width="120px"
                />
                <SortableHeaderCell
                  label="Order No"
                  sortKey="orderNum"
                  width="120px"
                />
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedOrders.map((order, idx) => (
                <TableRow key={idx}>
                  <DataCell width="100px">{order.date}</DataCell>
                  <DataCell width="100px">{order.sku}</DataCell>
                  <MultiLineDataCell width="220px">
                    {order.productName}
                  </MultiLineDataCell>
                  <NumericCell width="80px">{order.qty}</NumericCell>
                  <NumericCell width="100px">{order.salesPrice}</NumericCell>
                  <NumericCell width="240px">{order.total}</NumericCell>
                  <DataCell width="140px">{order.fulfillment}</DataCell>
                  <DataCell width="120px">{order.channel}</DataCell>
                  <NumericCell width="120px">{order.orderNum}</NumericCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Flex>
      ) : (
        <Text>No orders found for this contact.</Text>
      )}
    </>
  );
};

export default Extension;
