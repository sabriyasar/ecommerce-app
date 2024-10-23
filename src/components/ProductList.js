import React, { useEffect, useState } from "react";
import { Input, Button, Card, Typography } from "antd";
import "./css/ProductList.css";

const { Title, Paragraph } = Typography;

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const baseImageUrl = "https://cdn.dsmcdn.com";

  useEffect(() => {
    fetch("/products.html")
      .then((response) => response.text())
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const productElements = doc.querySelectorAll("div.p-card-wrppr");
        const productsArray = Array.from(productElements).map((element) => {
          const discountedPriceElement =
            element.querySelector(".prc-box-dscntd");
          const discountedPrice = discountedPriceElement
            ? parseFloat(
                discountedPriceElement.innerText
                  .trim()
                  .replace("₺", "")
                  .replace(".", "")
                  .replace(",", ".")
              )
            : null;

          return {
            id: element.getAttribute("data-id"),
            name: element.getAttribute("title"),
            price: {
              discountedPrice,
              originalPrice: null,
              sellingPrice: null,
            },
            // Görsel URL'sini kaldırdık
          };
        });

        setProducts(productsArray);
        setFilteredProducts(productsArray);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        setLoading(false);
      });
  }, []);

  const handleSearch = (event) => {
    const searchValue = event.target.value;
    setSearchTerm(searchValue);

    if (searchValue === "") {
      setFilteredProducts(products);
      return;
    }

    const foundProducts = products.filter((product) =>
      product.name.toLowerCase().includes(searchValue.toLowerCase())
    );
    setFilteredProducts(foundProducts);
  };

  const sortByPriceHighToLow = () => {
    const sortedProducts = [...filteredProducts].sort(
      (a, b) => (b.price.discountedPrice || 0) - (a.price.discountedPrice || 0)
    );
    setFilteredProducts(sortedProducts);
  };

  const sortByPriceLowToHigh = () => {
    const sortedProducts = [...filteredProducts].sort(
      (a, b) => (a.price.discountedPrice || 0) - (b.price.discountedPrice || 0)
    );
    setFilteredProducts(sortedProducts);
  };

  const handleClear = () => {
    setSearchTerm("");
    setFilteredProducts(products);
  };

  return (
    <div className="product-list-container">
      <Title level={1}>Ürün Listesi</Title>

      {loading ? (
        <Paragraph>Yükleniyor...</Paragraph>
      ) : (
        <>
          <Paragraph>
            <b style={{ color: "red" }}>
              Toplam Ürün Sayısı: {filteredProducts.length}
            </b>
          </Paragraph>

          <div style={{ marginBottom: 16 }}>
            <Input
              placeholder="Ürün ara..."
              value={searchTerm}
              onChange={handleSearch}
              style={{ width: 300, marginRight: 8 }}
            />
            <Button onClick={handleClear}>Temizle</Button>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Button onClick={sortByPriceHighToLow} style={{ marginRight: 8 }}>
              Fiyatı Yüksekten Düşüğe Sırala
            </Button>
            <Button onClick={sortByPriceLowToHigh}>
              Fiyatı Düşükten Yükseğe Sırala
            </Button>
          </div>

          <div className="product-grid">
            {filteredProducts.length > 0
              ? filteredProducts.map((product) => (
                  <div className="product-card" key={product.id}>
                    <Card hoverable>
                      <Card.Meta title={product.name} />
                      <Paragraph>
                        Fiyat:{" "}
                        {product.price.discountedPrice
                          ? `₺${product.price.discountedPrice.toFixed(2)}`
                          : "Fiyat Bilgisi Yok"}
                      </Paragraph>
                    </Card>
                  </div>
                ))
              : searchTerm !== "" && <Paragraph>Ürün bulunamadı.</Paragraph>}
          </div>
        </>
      )}
    </div>
  );
};

export default ProductList;
