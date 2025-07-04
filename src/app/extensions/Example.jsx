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

  const fetchOrders = async () => {
    try {
      const { response } = await runServerless({
        name: "myFunc",
        parameters: {
          contactId: context.crm?.objectId,
        },
      });

      if (response.statusCode !== 200) {
        sendAlert({
          type: "error",
          message: `Error fetching orders: ${response.body}`,
        });
        return;
      }

      const ordersArray = JSON.parse(response.body);
      console.log("Fetched orders array:", ordersArray);

      setOrders(ordersArray);
    } catch (e) {
      console.error("Failed to run serverless:", e);
      sendAlert({
        type: "error",
        message: `Failed to run serverless. Full error:\n${
          e?.message || JSON.stringify(e)
        }`,
      });
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

  // Compute filtered + sorted orders
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
    <TableCell width={width}>
      <Flex
        style={{
          padding: "8px",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Button
          onClick={() => handleSort(sortKey)}
          variant="tertiary"
          size="small"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontWeight: "bold",
            width: "100%",
            justifyContent: "center",
          }}
          aria-sort={
            sortConfig.key === sortKey
              ? sortConfig.direction === "asc"
                ? "ascending"
                : "descending"
              : "none"
          }
        >
          {label}
          {renderSortIndicator(sortKey)}
        </Button>
      </Flex>
    </TableCell>
  );

  const DataCell = ({ children, width }) => (
    <TableCell width={width}>
      <Flex
        style={{
          padding: "8px",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {children}
        </Text>
      </Flex>
    </TableCell>
  );

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
      </Flex>

      <Divider />

      {displayedOrders.length > 0 ? (
        <Table
          style={{
            tableLayout: "fixed",
            width: "100%",
          }}
        >
          <TableHead>
            <TableRow>
              <SortableHeaderCell label="Date" sortKey="date" width="100px" />
              <SortableHeaderCell label="SKU" sortKey="sku" width="100px" />
              <SortableHeaderCell
                label="Product Name"
                sortKey="productName"
                width="200px"
              />
              <SortableHeaderCell label="Qty" sortKey="qty" width="60px" />
              <SortableHeaderCell
                label="Sales"
                sortKey="salesPrice"
                width="80px"
              />
              <SortableHeaderCell label="Total" sortKey="total" width="80px" />
              <SortableHeaderCell
                label="Fulfillment"
                sortKey="fulfillment"
                width="120px"
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
                <DataCell width="200px">{order.productName}</DataCell>
                <DataCell width="60px">{order.qty}</DataCell>
                <DataCell width="80px">{order.salesPrice}</DataCell>
                <DataCell width="80px">{order.total}</DataCell>
                <DataCell width="120px">{order.fulfillment}</DataCell>
                <DataCell width="120px">{order.channel}</DataCell>
                <DataCell width="120px">{order.orderNum}</DataCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Text>No orders loaded yet.</Text>
      )}
    </>
  );
};

export default Extension;
