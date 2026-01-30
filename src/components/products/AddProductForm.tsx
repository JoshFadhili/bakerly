import { useState } from "react"
import { addProduct } from "../../services/productService"

export default function AddProductForm() {
  const [form, setForm] = useState({
    name: "",
    category: "",
    costPrice: "",
    salePrice: "",
    stock: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    await addProduct({
      name: form.name,
      category: form.category,
      costPrice: Number(form.costPrice),
      salePrice: Number(form.salePrice),
      stock: Number(form.stock),
      status: Number(form.stock) <= 5 ? "low_stock" : "active",
      createdAt: new Date(),
    })

    alert("Product added successfully")
  }

  return (
    <div className="space-y-4">
      <input name="name" placeholder="Product Name" onChange={handleChange} />
      <input name="category" placeholder="Category" onChange={handleChange} />
      <input name="costPrice" type="number" placeholder="Cost Price" onChange={handleChange} />
      <input name="salePrice" type="number" placeholder="Sale Price" onChange={handleChange} />
      <input name="stock" type="number" placeholder="Stock Quantity" onChange={handleChange} />

      <button
        onClick={handleSubmit}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Save Product
      </button>
    </div>
  )
}
