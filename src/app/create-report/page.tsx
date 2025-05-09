"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import NavHeader from "@/components/ui/nav-header";
import { useState, useTransition } from "react";
import { createReport } from "./action";

export default function CreateReport() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { id: "air-pollution", name: "Air Pollution", image: "/images/air-pollution.png" },
    { id: "water-pollution", name: "Water Pollution", image: "/images/water-pollution.png" },
    { id: "global-warming", name: "Global Warming", image: "/images/global-warming.png" },
    { id: "wildfire", name: "Wildfire", image: "/images/wildfire.png" },
  ];

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleBack = () => {
    setSelectedCategory(null);
  };

  const handleSubmit = async (formData: FormData) => {
    setMessage("");
    
    if (!selectedCategory) return;
    
    // Add the selected category to the form data
    formData.append("category", selectedCategory);
    
    startTransition(async () => {
      try {
        const result = await createReport(formData);
        
        if (result.success) {
          setMessageType("success");
          setMessage(result.message);
          // Reset the form and selection
          const form = document.getElementById("report-form") as HTMLFormElement;
          form?.reset();
          setSelectedCategory(null);
        } else {
          setMessageType("error");
          setMessage(result.message);
        }
      } catch (error) {
        setMessageType("error");
        setMessage("An error occurred while creating the report.");
        console.error(error);
      }
    });
  };

  return (
    <div className="relative min-h-screen w-full">
      {/* Background Image */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/wallpaper2.jpg"
          alt="Background"
          fill
          className="object-cover opacity-60"
          quality={100}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/30"></div>
      </div>

      {/* Content container */}
      <div className="relative z-10 min-h-screen p-8">
        <NavHeader />
        
        <div className="max-w-3xl mx-auto mt-12">
          <div className="text-center mb-8">
            <div className="mb-2 w-24 h-1 bg-amber-700 mx-auto"></div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-wider uppercase text-amber-100">
              Create Environmental Report
            </h1>
            <div className="mt-2 w-24 h-1 bg-amber-700 mx-auto"></div>
          </div>
          
          {message && (
            <div className={`border-l-2 border-amber-700 bg-black/40 p-4 mb-6 text-amber-100 font-serif text-center ${
              messageType === "error" ? "border-red-600" : "border-amber-700"
            }`}>
              <p>{message}</p>
            </div>
          )}
          
          {!selectedCategory ? (
            <div className="bg-black/40 border-t-2 border-b-2 border-amber-700/50 p-6 md:p-8">
              <h2 className="font-serif text-xl text-amber-100 mb-6 text-center">
                Select Environmental Issue Category
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {categories.map((category) => (
                  <div 
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className="cursor-pointer transition-transform hover:scale-105"
                  >
                    <div className="border-2 border-amber-700/50 overflow-hidden">
                      <Image
                        src={category.image}
                        alt={category.name}
                        width={200}
                        height={200}
                        className="object-cover w-full h-36"
                      />
                    </div>
                    <p className="font-serif text-amber-100 text-center mt-2">{category.name}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-black/40 border-t-2 border-b-2 border-amber-700/50 p-6 md:p-8">
              <button 
                onClick={handleBack}
                className="mb-4 text-amber-700 font-serif flex items-center hover:text-amber-500 transition-colors"
              >
                ← Back to Categories
              </button>
              
              <h2 className="font-serif text-xl text-amber-100 mb-6">
                Describe the {categories.find(c => c.id === selectedCategory)?.name} Issue
              </h2>
              
              <form action={handleSubmit} id="report-form">
                <div className="mb-6">
                  <label htmlFor="description" className="block text-sm font-medium text-amber-100 font-serif mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={6}
                    className="w-full px-4 py-3 bg-black/30 border-0 border-b-2 border-amber-700/70 text-amber-100 placeholder-amber-100/50 focus:border-amber-700 focus:outline-none focus:ring-0 font-serif"
                    placeholder="Describe the environmental issue in detail..."
                    required
                  />
                </div>
                
                {/* Hidden field for category */}
                <input 
                  type="hidden" 
                  name="category" 
                  value={selectedCategory || ""} 
                />
                
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full px-8 py-3 bg-transparent text-amber-100 font-serif border-2 border-amber-700 hover:bg-amber-700/20 transition-colors duration-300 uppercase tracking-widest"
                >
                  {isPending ? "Creating Report..." : "Create Report"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
