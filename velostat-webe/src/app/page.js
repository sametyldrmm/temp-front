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

  const calculateAverage = (day) => {
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
  
  

  const calculateCorrectIncorrect = (day) => {
    const averages = calculateAverage(day);
    if (Object.keys(averages).length === 0) return { correct: 0, incorrect: 100 };
    const totalAverage = Object.values(averages).reduce((acc, value) => acc + parseFloat(value), 0) / Object.keys(averages).length;
    const correct = parseFloat(totalAverage).toFixed(2);
    const incorrect = (100 - correct).toFixed(2);
    return { correct, incorrect };
  };  

  const getDayData = (day) => {
    if (!day || !dailyData || !dailyData[day]) {
      return "Bu tarihte veri yok";
    }
  
    const data = calculateAverage(day);
    if (Object.keys(data).length === 0) return "Bu tarihte veri yok";
  
    return (
      <div className="flex space-x-12 font-black">
        <div className="grid-container">
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
  
    let totalAverage = 0;
    let dayCount = 0;
  
    allDays.forEach((day) => {
      if (weeklyData[day] && Array.isArray(weeklyData[day]) && weeklyData[day].length > 0) {
        const rawData = weeklyData[day];
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
        const dayAverage = Object.values(averages).reduce((acc, value) => acc + parseFloat(value), 0) / Object.keys(averages).length;
        totalAverage += dayAverage;
        dayCount++;
      }
    });
  
    if (dayCount === 0) return { correct: 0, incorrect: 100 };
  
    const weeklyAverage = totalAverage / dayCount;
    const correct = parseFloat(weeklyAverage).toFixed(2);
    const incorrect = (100 - correct).toFixed(2);
  
    return { correct, incorrect };
  };
  
  const calculateMonthlyAverage = (month) => {
    const allDays = Object.keys(monthlyData).filter(day => day.includes(`-${month}-`));
    if (allDays.length === 0) return { correct: 0, incorrect: 100 };
  
    let totalAverage = 0;
    let dayCount = 0;
  
    allDays.forEach((day) => {
      if (monthlyData[day] && Array.isArray(monthlyData[day])) {
        const rawData = monthlyData[day];
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
        const dayAverage = Object.values(averages).reduce((acc, value) => acc + parseFloat(value), 0) / Object.keys(averages).length;
        totalAverage += dayAverage;
        dayCount++;
      }
    });
  
    if (dayCount === 0) return { correct: 0, incorrect: 100 };
  
    const monthlyAverage = totalAverage / dayCount;
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
        <div className="flex-1 bg-button-gray text-white rounded-3xl max-h-[560px] overflow-y-auto">
          <h3 className="text-3xl mt-10 text-center font-black">BİLGİLENDİRME</h3>
          <div className="pl-12 pr-12 mt-8">
            <ul className="text-left text-gray-300 text-lg font-thin list-disc pl-5">
              <li>1000 Saat Böyle Oturursan böyle olur</li>
              <li>2000 saat böyle oturursan şöyle olur</li>
              <li>Sırtını değdirerek oturmalısın</li>
              <li>Otur</li>
              <li>Oturmazsan oturmalısın bence yani oturmalı mısın</li>
            </ul>
          </div>
        </div>

        <div className="flex-1 text-white rounded-3xl flex flex-col items-center justify-center">
          <img
            src="/images/body.png"
            alt="Example PNG"
            className="mb-4 max-w-[1000px] h-auto lg:block sm:hidden"
          />
          <div>
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
