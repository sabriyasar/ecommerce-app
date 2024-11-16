import React, { useEffect, useState } from "react";
import { Input, Button, Card, Typography, Pagination } from "antd";
import { FileExcelOutlined } from "@ant-design/icons"; // Excel ikonu
import * as XLSX from "xlsx"; // Excel kütüphanesi
import "./css/ProductList.css";

const { Title, Paragraph } = Typography;

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]); // Yeni ürünler için state
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedProductIds, setCopiedProductIds] = useState([]);
  const [previousProductIds, setPreviousProductIds] = useState([]); // Önceki ürün ID'leri
  const [currentPage, setCurrentPage] = useState(1); // Sayfa numarası
  const [isNewProductFilterActive, setIsNewProductFilterActive] = useState(false); // Yeni ürün filtresi
  const [isRemovedProductFilterActive, setIsRemovedProductFilterActive] = useState(false); // Silinen ürün filtresi
  const productsPerPage = 20; // Her sayfada gösterilecek ürün sayısı
  const [addedProductCount, setAddedProductCount] = useState(0); // Yeni eklenen ürün sayısı
  const [removedProductCount, setRemovedProductCount] = useState(0); // Silinen ürün sayısı
  const [removedProducts, setRemovedProducts] = useState([]); // Silinen ürünler

  useEffect(() => {
    const savedCopiedProductIds = JSON.parse(
      localStorage.getItem("copiedProductIds") || "[]"
    );
    setCopiedProductIds(savedCopiedProductIds);

    const savedNewProducts = JSON.parse(localStorage.getItem("newProducts") || "[]");
    const savedPreviousProductIds = JSON.parse(
      localStorage.getItem("previousProductIds") || "[]"
    );
    setPreviousProductIds(savedPreviousProductIds);

    fetch("/products804.html") // Eski ürün sayfası
      .then((response) => response.text())
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const productElements = doc.querySelectorAll("div.p-card-wrppr");
        const previousProductsArray = Array.from(productElements).map((element) => {
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

          const linkElement = element.querySelector("a");
          const productLink = linkElement ? linkElement.href : "#";

          return {
            id: element.getAttribute("data-id"),
            name: element.getAttribute("title"),
            price: {
              discountedPrice,
              originalPrice: null,
              sellingPrice: null,
            },
            link: productLink,
          };
        });

        // Yeni ürün sayfasını al
        fetch("/products.html") // Yeni ürün sayfası
          .then((response) => response.text())
          .then((html) => {
            const doc = new DOMParser().parseFromString(html, "text/html");
            const newProductElements = doc.querySelectorAll("div.p-card-wrppr");
            const newProductsArray = Array.from(newProductElements).map((element) => {
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

              const linkElement = element.querySelector("a");
              const productLink = linkElement ? linkElement.href : "#";

              return {
                id: element.getAttribute("data-id"),
                name: element.getAttribute("title"),
                price: {
                  discountedPrice,
                  originalPrice: null,
                  sellingPrice: null,
                },
                link: productLink,
              };
            });

            // Yeni eklenen ürünleri bul
            const newAddedProducts = newProductsArray.filter(
              (product) => !previousProductsArray.some((prev) => prev.id === product.id)
            );

            // Silinen ürünleri bul
            const removedProducts = previousProductsArray.filter(
              (product) => !newProductsArray.some((newProduct) => newProduct.id === product.id)
            );

            // Yeni eklenen ve silinen ürün sayısını ayarla
            setAddedProductCount(newAddedProducts.length);
            setRemovedProductCount(removedProducts.length);
            setRemovedProducts(removedProducts); // Silinen ürünleri kaydet

            // Yeni eklenen ürünleri kaydet
            setNewProducts(newAddedProducts); // Yeni ürünler listesine kaydet
            setPreviousProductIds((prevIds) => [
              ...prevIds,
              ...newAddedProducts.map((product) => product.id),
            ]);

            // Eski ürünlerle karşılaştırıp kaydet
            setProducts(newProductsArray);
            setFilteredProducts(newProductsArray);
            setLoading(false);
          });
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        setLoading(false);
      });
  }, [previousProductIds]);

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

  const handleCopyLink = (productId, link) => {
    navigator.clipboard.writeText(link).then(() => {
      setCopiedProductIds((prevCopied) => {
        const updatedCopied = [...prevCopied, productId];
        localStorage.setItem("copiedProductIds", JSON.stringify(updatedCopied));
        return updatedCopied;
      });
    });
  };

  const handleClearSelection = (productId) => {
    setCopiedProductIds((prevCopied) => {
      const updatedCopied = prevCopied.filter((id) => id !== productId);
      localStorage.setItem("copiedProductIds", JSON.stringify(updatedCopied));
      return updatedCopied;
    });
  };

  const downloadExcel = () => {
    const data = filteredProducts.map((product) => ({
      "Ürün Adı": product.name,
      "Fiyat (₺)": product.price.discountedPrice
        ? product.price.discountedPrice.toFixed(2)
        : "Fiyat Bilgisi Yok",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ürünler");

    XLSX.writeFile(workbook, "urunler.xlsx");
  };

  // Pagination işlemi
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Sayfaya göre ürünleri filtrele
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = isRemovedProductFilterActive
    ? removedProducts.slice(indexOfFirstProduct, indexOfLastProduct) // Silinen ürünler
    : isNewProductFilterActive
    ? newProducts.slice(indexOfFirstProduct, indexOfLastProduct) // Yeni ürünler
    : filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct); // Tüm ürünler

  // Yeni ürün filtresi butonunun işlevi
  const toggleNewProductFilter = () => {
    setIsNewProductFilterActive((prev) => !prev);
    setCurrentPage(1); // Filtremiz değiştiğinde sayfa numarasını 1'e resetleyelim
  };

  // Silinen ürün filtresi butonunun işlevi
  const toggleRemovedProductFilter = () => {
    setIsRemovedProductFilterActive((prev) => !prev);
    setCurrentPage(1); // Filtremiz değiştiğinde sayfa numarasını 1'e resetleyelim
  };

  // Yeni ürün filtresi aktifse pagination'ı ona göre güncelle
  const totalProducts = isRemovedProductFilterActive
    ? removedProducts.length
    : isNewProductFilterActive
    ? newProducts.length
    : filteredProducts.length;

  return (
    <div className="product-list-container">
      <Title level={1}>Ürün Listesi</Title>

      {loading ? (
        <Paragraph>Yükleniyor...</Paragraph>
      ) : (
        <>
          <Paragraph
            style={{
              backgroundColor: "#001f3d",
              color: "white",
              padding: "5px",
              borderRadius: "5px",
            }}
          >
            <b>Toplam Ürün Sayısı: {filteredProducts.length}</b>
          </Paragraph>

          <Paragraph
            style={{
              backgroundColor: "#52c41a",
              color: "white",
              padding: "5px",
              borderRadius: "5px",
            }}
          >
            <b>Yeni Eklenen Ürün Sayısı: {addedProductCount}</b>
          </Paragraph>

          <Paragraph
            style={{
              backgroundColor: "#ff4d4f",
              color: "white",
              padding: "5px",
              borderRadius: "5px",
            }}
          >
            <b>Silinen Ürün Sayısı: {removedProductCount}</b>
          </Paragraph>

          {/* "Ürün Ara" ve "Temizle" butonları Silinen Ürün Sayısı'nın altına taşındı */}
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
            <Button
              onClick={toggleNewProductFilter}
              style={{
                marginLeft: 16,
                backgroundColor: isNewProductFilterActive ? "green" : "#3cb371",
                borderColor: isNewProductFilterActive ? "green" : "#3cb371",
                color: "white",
              }}
            >
              {isNewProductFilterActive ? "Filtreyi Kaldır" : "Yeni Ürünleri Göster"}
            </Button>
            <Button
              onClick={toggleRemovedProductFilter}
              style={{
                marginLeft: 8,
                backgroundColor: isRemovedProductFilterActive ? "blue" : "#0000FF",
                borderColor: isRemovedProductFilterActive ? "blue" : "#0000FF",
                color: "white",
              }}
            >
              {isRemovedProductFilterActive ? "Filtreyi Kaldır" : "Silinen Ürünleri Göster"}
            </Button>
            <Button
              onClick={sortByPriceLowToHigh}
              style={{ marginLeft: 8 }}
            >
              Fiyatı Düşükten Yükseğe Sırala
            </Button>
            <Button
              onClick={sortByPriceHighToLow}
              style={{ marginLeft: 8 }}
            >
              Fiyatı Yüksekten Düşüğe Sırala
            </Button>
            <Button
              onClick={downloadExcel}
              icon={<FileExcelOutlined />}
              style={{
                backgroundColor: "#007a33",
                borderColor: "#007a33",
                color: "white",
                marginLeft: 8,
              }}
            >
              Excel İndir
            </Button>
          </div>

          <div className="product-grid">
            {currentProducts.map((product) => (
              <div className="product-card" key={product.id}>
                <Card hoverable>
                  {newProducts.some((newProduct) => newProduct.id === product.id) && (
                    <div className="new-product-tag">Yeni Ürün!</div>
                  )}
                  <Card.Meta title={product.name} />
                  <Paragraph>
                    Fiyat:{" "}
                    {product.price.discountedPrice
                      ? `₺${product.price.discountedPrice.toFixed(2)}`
                      : "Fiyat Bilgisi Yok"}
                  </Paragraph>
                  <Paragraph>
                    <a
                      href={product.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ürün Linki
                    </a>
                  </Paragraph>
                  <Button
                    onClick={() => handleCopyLink(product.id, product.link)}
                    style={{
                      backgroundColor: copiedProductIds.includes(product.id)
                        ? "green"
                        : "gray",
                      color: "white",
                      marginRight: 8,
                    }}
                  >
                    {copiedProductIds.includes(product.id)
                      ? "Kopyalandı!"
                      : "Linki Kopyala"}
                  </Button>
                  <Button
                    onClick={() => handleClearSelection(product.id)}
                    style={{ backgroundColor: "red", color: "white" }}
                  >
                    Seçimi Temizle
                  </Button>
                </Card>
              </div>
            ))}
          </div>

          <Pagination
            current={currentPage}
            pageSize={productsPerPage}
            total={totalProducts}
            onChange={handlePageChange}
            style={{ marginTop: 20, textAlign: "center" }}
          />
        </>
      )}
    </div>
  );
};

export default ProductList;
