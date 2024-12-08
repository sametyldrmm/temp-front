"use client";

import { useState, useEffect } from "react";
import { PieChart } from "../companents/PieChart";
import axios from "axios";
import { format, startOfWeek, addDays } from 'date-fns';

export default function HomePage() {
  const [selectedDay, setSelectedDay] = useState(null);
  const [viewMode, setViewMode] = useState("day");
  const [dailyData, setDailyData] = useState({});
  const [weeklyData, setWeeklyData] = useState({});
  const [monthlyData, setMonthlyData] = useState({});
  const [loading, setLoading] = useState(false);

  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);
  const weeksInYear = Array.from({ length: 52 }, (_, i) => `Week ${i + 1}`);
  const monthsInYear = [
    "01", "02", "03", "04", "05", "06", 
    "07", "08", "09", "10", "11", "12"
  ];

  const userDefinedValues = { "day": "", "a": 500, "b": 500, "c": 500, "d": 500, "e": 500, "f": 500 };

  const fetchDataForDay = async (day) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/data?day=${day}`);
      console.log("Günlük Gelen Veri:", response.data);
      const formattedData = response.data.filter(item => format(new Date(item.day), 'yyyy-MM-dd') === day).map(item => ({
        ...item,
        day: format(new Date(item.day), 'yyyy-MM-dd')
      }));
      setDailyData((prevData) => ({ ...prevData, [day]: formattedData }));
    } catch (error) {
      console.error("Veri çekme hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDataForWeek = async (weekStart) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/data?weekStart=${weekStart}`);
      const weekData = {};
      for (let i = 0; i < 7; i++) {
        const currentDay = format(addDays(new Date(weekStart), i), 'yyyy-MM-dd');
        weekData[currentDay] = response.data.filter(item => format(new Date(item.day), 'yyyy-MM-dd') === currentDay);
      }
      console.log(weekData); 
      setWeeklyData(weekData);
    } catch (error) {
      console.error("Veri çekme hatası:", error);
    } finally {
      setLoading(false);
    }
  };
  

  const fetchDataForMonth = async (month) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/data?month=${month}`);
      const monthData = response.data.reduce((acc, item) => {
        const formattedDay = format(new Date(item.day), 'yyyy-MM-dd');
        if (formattedDay.includes(`-${month}-`)) {
          if (!acc[formattedDay]) {
            acc[formattedDay] = [];
          }
          acc[formattedDay].push(item);
        }
        return acc;
      }, {});
      setMonthlyData(monthData);
    } catch (error) {
      console.error("Veri çekme hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item) => {
    setSelectedDay(item);
  
    if (viewMode === "day") {
      fetchDataForDay(item);
    } else if (viewMode === "week") {
      fetchDataForWeek(item);
    } else if (viewMode === "month") {
      fetchDataForMonth(item);
    }
  };

  const calculateAverageOld = (day) => {
    if (!dailyData[day] || dailyData[day].length === 0) return {};
  
    const rawData = dailyData[day];
    const averages = {};

    rawData.forEach((entry) => {
      Object.keys(entry).forEach((key) => {
        if (typeof entry[key] === "number") {
          if (!averages[key]) {
            averages[key] = 0;
          }
          averages[key] += entry[key];
        }
      });
    });
    Object.keys(averages).forEach((key) => {
      averages[key] /= rawData.length;
    });
  
    console.log("Calculated Averages for Day:", day, averages); // Console log to verify calculated averages
    return averages;
  };
  
  const calculateAverage = (day) => {
    if (!dailyData[day] || dailyData[day].length === 0) return 0;
  
    const rawData = dailyData[day];
    let totalSimilarity = 0;
  
    rawData.forEach((entry) => {
      totalSimilarity += calculateSimilarity(userDefinedValues, entry); 
    });
  
    const averageSimilarity = totalSimilarity / rawData.length;
  
    console.log("Calculated Averages for Day:", day, averageSimilarity); // Console log to verify calculated averages
    return averageSimilarity;
  };
  

  function calculateSimilarity(values1, values2) {
    let totalSimilarity = 0;
    const keys = Object.keys(values1);
  
    for (let key of keys) {
      if (key !== "day") {
        const maxVal = Math.max(values1[key], values2[key]);
        const minVal = Math.min(values1[key], values2[key]);
        totalSimilarity += (minVal / maxVal) * 100;
      }
    }
  
    return totalSimilarity / (keys.length - 1); // "day" alanını saymadığımız için -1
  }

  // const calculateCorrectIncorrect = (day) => {
  //   const averages = calculateAverage(day);
  //   // if (Object.keys(averages).length === 0) return { correct: 0, incorrect: 100 };
  //   if (averages === 0) 
  //     return { correct: 0, incorrect: 100 };
  //   // const totalAverage = Object.values(averages).reduce((acc, value) => acc + parseFloat(value), 0) / Object.keys(averages).length;
  //   const totalAverage = averages;
  //   const correct = parseFloat(totalAverage).toFixed(2);
  //   const incorrect = (100 - correct).toFixed(2);
  //   return { correct, incorrect };
  // };  

  const calculateCorrectIncorrect = (day) => {
    const average = calculateAverage(day);
    if (average === 0) return { correct: 0, incorrect: 100 };
  
    const correct = parseFloat(average).toFixed(2);
    const incorrect = (100 - correct).toFixed(2);
    return { correct, incorrect };
  };
  

  const getDayData = (day) => {
    if (!day || !dailyData || !dailyData[day]) {
      return "";
    }
  
    const data = calculateAverageOld(day);
    if (Object.keys(data).length === 0) return "";
  
    return (
      <div className="flex space-x-12 font-black ">
        <div className="grid-container pl-8">
          {Object.keys(data).map((key, index) => {
            if (key === 'id') return null; // 'id' anahtarını atla
            return (
              <div key={index} className="grid-item">
                {key.toUpperCase()} : <span className="text-blue-400">{data[key] ? data[key].toFixed(2) : 0}%</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const calculateWeeklyAverage = (weekStart) => {
    const allDays = Object.keys(weeklyData);
    if (allDays.length === 0) return { correct: 0, incorrect: 100 };
  
    let totalSimilarity = 0;
    let dayCount = 0;
  
    allDays.forEach((day) => {
      if (weeklyData[day] && Array.isArray(weeklyData[day]) && weeklyData[day].length > 0) {
        const rawData = weeklyData[day];
        rawData.forEach((entry) => {
          totalSimilarity += calculateSimilarity(userDefinedValues, entry);
        });
        dayCount += rawData.length;
      }
    });
  
    if (dayCount === 0) return { correct: 0, incorrect: 100 };
  
    const weeklyAverage = totalSimilarity / dayCount;
    const correct = parseFloat(weeklyAverage).toFixed(2);
    const incorrect = (100 - correct).toFixed(2);
  
    return { correct, incorrect };
  };
  
  
  const calculateMonthlyAverage = (month) => {
    const allDays = Object.keys(monthlyData).filter(day => day.includes(`-${month}-`));
    if (allDays.length === 0) return { correct: 0, incorrect: 100 };
  
    let totalSimilarity = 0;
    let dayCount = 0;
  
    allDays.forEach((day) => {
      if (monthlyData[day] && Array.isArray(monthlyData[day])) {
        const rawData = monthlyData[day];
        rawData.forEach((entry) => {
          totalSimilarity += calculateSimilarity(userDefinedValues, entry);
        });
        dayCount += rawData.length;
      }
    });
  
    if (dayCount === 0) return { correct: 0, incorrect: 100 };
  
    const monthlyAverage = totalSimilarity / dayCount;
    const correct = parseFloat(monthlyAverage).toFixed(2);
    const incorrect = (100 - correct).toFixed(2);
  
    return { correct, incorrect };
  };
  

  const renderDailyPieChart = () => {
    const { correct, incorrect } = calculateCorrectIncorrect(selectedDay);
    const dataForChart = {
      labels: ['Doğru', 'Yanlış'],
      datasets: [
        {
          data: [correct, incorrect],
          backgroundColor: ['#60a5fa', '#93c5fd'],
          borderColor: ['#202020', '#202020'],
          borderWidth: 0,
        },
      ],
    };
    
    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: (tooltipItem) => {
              return `${tooltipItem.label}: ${tooltipItem.raw.toFixed(2)}%`;
            },
          },
        },
      },
    };

    return (
      <div className="w-full max-w-md mx-auto mt-10">
        <PieChart data={dataForChart} options={options} />
        <div className="text-center mt-4">
          <p className="text-xl font-bold">Doğru Oturuş: <span className="text-blue-300">{correct}%</span></p>
          <p className="text-xl font-bold">Yanlış Oturuş: <span className="text-blue-300">{incorrect}%</span></p>
        </div>
      </div>
    );
  };

  const renderWeeklyPieChart = () => {
    const { correct, incorrect } = calculateWeeklyAverage(selectedDay);
    const dataForChart = {
      labels: ['Doğru', 'Yanlış'],
      datasets: [
        {
          data: [correct, incorrect],
          backgroundColor: ['#60a5fa', '#93c5fd'],
          borderColor: ['#202020', '#202020'],
          borderWidth: 0,
        },
      ],
    };
    
    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: (tooltipItem) => {
              return `${tooltipItem.label}: ${tooltipItem.raw.toFixed(2)}%`;
            },
          },
        },
      },
    };

    return (
      <div className="w-full max-w-md mx-auto mt-10">
        <PieChart data={dataForChart} options={options} />
        <div className="text-center mt-4">
          <p className="text-xl font-bold">Doğru Oturuş: <span className="text-blue-300">{correct}%</span></p>
          <p className="text-xl font-bold">Yanlış Oturuş: <span className="text-blue-300">{incorrect}%</span></p>
        </div>
      </div>
    );
  };

  const renderMonthlyPieChart = () => {
    const { correct, incorrect } = calculateMonthlyAverage(selectedDay);
    const dataForChart = {
      labels: ['Doğru', 'Yanlış'],
      datasets: [
        {
          data: [correct, incorrect],
          backgroundColor: ['#60a5fa', '#93c5fd'],
          borderColor: ['#202020', '#202020'],
          borderWidth: 0,
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: (tooltipItem) => {
              return `${tooltipItem.label}: ${tooltipItem.raw.toFixed(2)}%`;
            },
          },
        },
      },
    };

    return (
      <div className="w-full max-w-md mx-auto mt-10">
        <PieChart data={dataForChart} options={options} />
        <div className="text-center mt-4">
          <p className="text-xl font-bold">Doğru Oturuş: <span className="text-blue-300">{correct}%</span></p>
          <p className="text-xl font-bold">Yanlış Oturuş: <span className="text-blue-300">{incorrect}%</span></p>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (viewMode) {
      case "day":
        return daysInMonth.map((day) => {
          const currentYear = new Date().getFullYear();
          const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
          const dayString = `${currentYear}-${currentMonth}-${String(day).padStart(2, '0')}`;
          return (
            <button
              key={day}
              className={`py-1.5 px-4 rounded-2xl text-2xl font-black transition-all duration-300 ${
                selectedDay === dayString
                  ? "bg-blue-400 font-black text-dark-gray"
                  : "bg-button-gray text-light-gray"
              }`}
              onClick={() => handleItemClick(dayString)}
            >
              {day}
            </button>
          );
        });
      case "week":
        return weeksInYear.map((week, i) => {
          const startOfWeekDay = format(startOfWeek(new Date(`2024-01-01`), { weekStartsOn: 1 }), 'yyyy-MM-dd');
          const weekStart = format(addDays(new Date(startOfWeekDay), i * 7), 'yyyy-MM-dd');
          return (
            <button
              key={week}
              className={`py-1.5 px-4 rounded-2xl text-lg font-black transition-all duration-300 ${
                selectedDay === weekStart ? "bg-blue-400 text-dark-gray" : "bg-button-gray text-light-gray"
              }`}
              onClick={() => handleItemClick(weekStart)}
            >
              {week}
            </button>
          );
        });
      case "month":
        return monthsInYear.map((month) => (
          <button
            key={month}
            className={`py-1.5 px-4 rounded-2xl text-lg font-black transition-all duration-300 ${
              selectedDay === month ? "bg-blue-400 text-dark-gray" : "bg-button-gray text-light-gray"
            }`}
            onClick={() => handleItemClick(month)}
          >
            {month}
          </button>
        ));
      default:
        return null;
    }
  };
  
  


  return (
    <main className="flex flex-col items-center justify-start min-h-screen bg-dark-gray text-light-gray">
      <div className="text-center mb-16 mt-16">
        <p className="text-5xl font-bold mb-8">İstanbul Gelişim Üniversitesi</p>
        <p className="text-4xl font-medium mt-2">Basınça Duyarlı Koltuk</p>
      </div>

      <div className="flex space-x-4 mb-2 bg-table-gray p-3 rounded-3xl">
        {["day", "week", "month"].map((mode) => (
          <button
            key={mode}
            className={`py-2 px-6 text-lg font-black rounded-3xl transition-all duration-300 ${
              viewMode === mode ? "bg-blue-300 text-dark-gray" : "bg-button-gray text-white"
            }`}
            onClick={() => setViewMode(mode)}
          >
            {mode === "day" ? "Günlük" : mode === "week" ? "Haftalık" : "Aylık"}
          </button>
        ))}
      </div>

      <div className="flex overflow-x-auto space-x-4 mb-8 py-3 m-2 p-3 max-w-screen-lg bg-table-gray rounded-3xl">
        <div className="flex flex-nowrap space-x-3">
          {renderContent()}
        </div>
      </div>
      <div className="flex flex-col lg:flex-row space-y-10 lg:space-y-0 lg:space-x-10 w-full max-w-[1400px] mt-10 mb-32">
        <div className="flex-1 bg-button-gray p-8 text-white rounded-3xl max-h-[560px] overflow-y-auto">
          <h3 className="text-3xl mt-4 mb-4 m-2 text-center font-black">BİLGİLENDİRME</h3>
          <div className="rounded-lg p-2 mb-6">
            <h2 className="text-xl text-gray-100 font-semibold mb-2">A Bölgesi (Omuz Üstü - Boyun ve Üst Sırt)</h2>
            <p className="text-gray-200">8 saatten fazla yanlış oturmak boyun kaslarında aşırı gerginliğe yol açarak baş ağrılarına ve boyun bölgesinde kronik ağrılara neden olabilir.</p>
          </div>

          <div className="rounded-lg p-2 mb-6">
            <h2 className="text-xl text-gray-100 font-semibold mb-2">B Bölgesi (Omuz Altı ve Kürek Kemiği Alanı)</h2>
            <p className="text-gray-200">6-7 saat yanlış oturmak bu bölgedeki kasların zayıflamasına, özellikle kamburluk ve sırt ağrılarının ortaya çıkmasına ve çeşitli kas spazmlarına neden olabilir.</p>
          </div>

          <div className="rounded-lg p-2 mb-6">
            <h2 className="text-xl text-gray-100 font-semibold mb-2">C Bölgesi (Göğüs Orta Hattı - Omurganın Üst Kısmı)</h2>
            <p className="text-gray-200">9-10 saat yanlış oturmak, akciğer kapasitesinin düşmesine, kaburga ağrılarına ve nefes darlığına yol açabilir.</p>
          </div>

          <div className="rounded-lg p-2 mb-6">
            <h2 className="text-xl text-gray-100 font-semibold mb-2">D Bölgesi (Omurganın Orta Hattı)</h2>
            <p className="text-gray-200">10 saatten fazla yanlış oturmak bu bölgede disk dejenerasyonuna yol açabilir, omurga eğriliği ve bel fıtığı riskini artırabilir.</p>
          </div>

          <div className="rounded-lg p-2 mb-6">
            <h2 className="text-xl text-gray-100 font-semibold mb-2">E Bölgesi (Alt Sırt - Bel Bölgesi)</h2>
            <p className="text-gray-200">5-6 saat yanlış oturmak, bel omurlarına ekstra yük bindirir ve bel ağrısı ile siyatik sinir sıkışmasını tetikleyebilir. Ayrıca bel fıtığı riskini artırır.</p>
          </div>

          <div className="rounded-lg p-2 mb-6">
            <h2 className="text-xl text-gray-100 font-semibold mb-2">F Bölgesi (Alt Omurga - Kuyruk Sokumu)</h2>
            <p className="text-gray-200">8-9 saat yanlış oturmak, bu bölgedeki sinirlerin sıkışmasına ve kuyruk sokumu ağrılarının oluşmasına neden olabilir.</p>
          </div>

          <div className="rounded-lg p-2 mb-6">
            <h2 className="text-xl text-gray-100 font-semibold mb-2">Genel Öneriler:</h2>
            <ul className="list-disc list-inside text-gray-200">
              <li><span className="font-semibold">Duruşu Düzeltmek:</span> Dik oturmaya ve her 30-40 dakikada bir pozisyon değiştirmeye özen gösterin.</li>
              <li><span className="font-semibold">Ergonomik Destek:</span> Bel ve sırt için uygun bir destek kullanın.</li>
              <li><span className="font-semibold">Fiziksel Aktivite:</span> Günde en az 30 dakika egzersiz, sırt kaslarının güçlenmesini destekler.</li>
            </ul>
          </div>

        </div>

        <div className="flex-1 text-white rounded-3xl flex flex-col items-center justify-center">
          <img
            src="/images/body.png"
            alt="Example PNG"
            className="mb-4 max-w-[1000px] h-auto lg:block sm:hidden"
          />
          <div className="-mt-20">
            {viewMode === "day" && (
              <p className="font-semibold text-center mb-8 text-2xl">Bölgeye Temas Oranı</p>
            )}
            {getDayData(selectedDay)}
          </div>
        </div>

        <div className="flex-1 bg-button-gray h-[560px] rounded-3xl text-center">
          <p className="text-3xl pt-10 text-center font-black">
            {viewMode === "day" ? "GÜNLÜK RAPOR" : viewMode === "week" ? "HAFTALIK RAPOR" : "AYLIK RAPOR"}
          </p>
          <div className="max-w-[300px] mx-auto mt-8">
            {viewMode === "day" ? renderDailyPieChart() : viewMode === "week" ? renderWeeklyPieChart() : renderMonthlyPieChart()}
          </div>
        </div>
      </div>
    </main>
  );
}
