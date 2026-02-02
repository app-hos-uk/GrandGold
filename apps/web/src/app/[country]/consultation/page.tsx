'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  Video,
  Calendar,
  Clock,
  User,
  MessageCircle,
  Star,
  ChevronRight,
  Check,
  Play,
} from 'lucide-react';

const experts = [
  {
    id: '1',
    name: 'Priya Sharma',
    role: 'Senior Jewellery Consultant',
    experience: '15+ years',
    rating: 4.9,
    reviews: 342,
    specialization: ['Bridal', 'Traditional', 'Custom Design'],
    languages: ['English', 'Hindi'],
    available: true,
  },
  {
    id: '2',
    name: 'Rahul Mehta',
    role: 'Diamond Expert',
    experience: '12+ years',
    rating: 4.8,
    reviews: 256,
    specialization: ['Diamonds', 'Engagement Rings', 'Investment'],
    languages: ['English', 'Hindi', 'Gujarati'],
    available: true,
  },
  {
    id: '3',
    name: 'Ananya Reddy',
    role: 'Fashion Jewellery Stylist',
    experience: '8+ years',
    rating: 4.9,
    reviews: 189,
    specialization: ['Contemporary', 'Everyday Wear', 'Gifting'],
    languages: ['English', 'Hindi', 'Telugu'],
    available: false,
  },
];

const FALLBACK_SLOTS = ['10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];

function formatSlot(s: string): string {
  const [h, m] = s.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}

const features = [
  {
    icon: Video,
    title: 'HD Video Call',
    description: 'Crystal clear video consultation from the comfort of your home',
  },
  {
    icon: User,
    title: 'Expert Guidance',
    description: 'Personal advice from certified jewellery consultants',
  },
  {
    icon: MessageCircle,
    title: 'Live Chat Support',
    description: 'Chat during the call and get instant answers to your questions',
  },
];

export default function ConsultationPage() {
  const params = useParams();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';
  
  const [selectedExpert, setSelectedExpert] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [slotData, setSlotData] = useState<{ date: string; slots: string[] }[]>([]);
  const [bookedRoom, setBookedRoom] = useState<{ roomId: string; date: string; slot: string } | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ date: string; slots: string[] }[]>('/api/consultation/slots')
      .then((data) => setSlotData(Array.isArray(data) ? data : []))
      .catch(() => setSlotData([]));
  }, []);

  // Generate next 7 days (fallback if API fails)
  const dates = slotData.length > 0
    ? slotData.map((d) => {
        const date = new Date(d.date);
        return {
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          date: date.getDate(),
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          full: d.date,
        };
      })
    : Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
        return {
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          date: date.getDate(),
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          full: date.toISOString().split('T')[0],
        };
      });

  return (
    <main className="min-h-screen bg-cream-50">
      {/* Hero Section */}
      <section className="bg-gradient-luxury py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500/10 rounded-full text-gold-700 text-sm font-medium mb-6">
              <Video className="w-4 h-4" />
              Virtual Consultation
            </div>
            <h1 className="font-display text-4xl lg:text-5xl font-semibold text-gray-900 mb-4">
              Expert Jewellery Consultation
            </h1>
            <p className="text-gray-600 text-lg">
              Connect with our certified jewellery experts via video call. Get personalized
              advice on designs, pricing, and find the perfect piece for any occasion.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 border-b border-cream-200 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-14 h-14 mx-auto mb-4 bg-gold-100 rounded-2xl flex items-center justify-center">
                  <feature.icon className="w-7 h-7 text-gold-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Progress Steps */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="flex items-center justify-between">
              {['Select Expert', 'Choose Date & Time', 'Confirm'].map((label, index) => (
                <div key={label} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                      step > index + 1
                        ? 'bg-green-500 text-white'
                        : step === index + 1
                        ? 'bg-gold-500 text-white'
                        : 'bg-cream-200 text-gray-500'
                    }`}
                  >
                    {step > index + 1 ? <Check className="w-5 h-5" /> : index + 1}
                  </div>
                  {index < 2 && (
                    <div
                      className={`w-24 lg:w-32 h-1 mx-2 ${
                        step > index + 1 ? 'bg-green-500' : 'bg-cream-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {['Select Expert', 'Choose Date & Time', 'Confirm'].map((label) => (
                <span key={label} className="text-xs text-gray-500 w-24 text-center">
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Step 1: Select Expert */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-4xl mx-auto"
            >
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                Choose Your Expert
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {experts.map((expert) => (
                  <div
                    key={expert.id}
                    onClick={() => expert.available && setSelectedExpert(expert.id)}
                    className={`bg-white rounded-2xl p-6 cursor-pointer transition-all ${
                      !expert.available
                        ? 'opacity-50 cursor-not-allowed'
                        : selectedExpert === expert.id
                        ? 'ring-2 ring-gold-500 shadow-luxury'
                        : 'hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-gold-100 to-cream-200 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-gold-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{expert.name}</h3>
                        <p className="text-sm text-gray-500">{expert.role}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="w-4 h-4 text-gold-500 fill-gold-500" />
                      <span className="font-medium">{expert.rating}</span>
                      <span className="text-gray-400 text-sm">({expert.reviews} reviews)</span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {expert.experience} experience
                    </p>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {expert.specialization.map((spec) => (
                        <span
                          key={spec}
                          className="px-2 py-1 bg-cream-100 text-xs text-gray-600 rounded"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      Languages: {expert.languages.join(', ')}
                    </p>
                    
                    {!expert.available && (
                      <p className="text-sm text-red-500 mt-3">Currently unavailable</p>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="text-center mt-8">
                <button
                  onClick={() => selectedExpert && setStep(2)}
                  disabled={!selectedExpert}
                  className="px-8 py-3 bg-gold-500 hover:bg-gold-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Select Date & Time */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-2xl mx-auto"
            >
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                Select Date & Time
              </h2>
              
              {/* Date Selection */}
              <div className="bg-white rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-gold-500" />
                  <h3 className="font-medium">Select Date</h3>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {dates.map((date) => (
                    <button
                      key={date.full}
                      onClick={() => setSelectedDate(date.full)}
                      className={`p-3 rounded-xl text-center transition-all ${
                        selectedDate === date.full
                          ? 'bg-gold-500 text-white'
                          : 'bg-cream-50 hover:bg-cream-100'
                      }`}
                    >
                      <p className="text-xs">{date.day}</p>
                      <p className="text-lg font-semibold">{date.date}</p>
                      <p className="text-xs">{date.month}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Time Selection */}
              <div className="bg-white rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-gold-500" />
                  <h3 className="font-medium">Select Time</h3>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {(selectedDate
                    ? slotData.find((d) => d.date === selectedDate)?.slots ?? FALLBACK_SLOTS
                    : []
                  ).map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`py-3 px-4 rounded-lg text-sm transition-all ${
                        selectedTime === time
                          ? 'bg-gold-500 text-white'
                          : 'bg-cream-50 hover:bg-cream-100'
                      }`}
                    >
                      {formatSlot(time)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={async () => {
                    if (!selectedDate || !selectedTime) return;
                    setBooking(true);
                    try {
                      setBookingError(null);
                      const result = await api.post<{ roomId: string; date: string; slot: string }>(
                        '/api/consultation/book',
                        { date: selectedDate, slot: selectedTime, country: country.toUpperCase() }
                      );
                      setBookedRoom(result);
                      setStep(3);
                    } catch {
                      setBookingError('Booking failed. Please try again.');
                    }
                    setBooking(false);
                  }}
                  disabled={!selectedDate || !selectedTime || booking}
                  className="px-8 py-3 bg-gold-500 hover:bg-gold-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  {booking ? 'Booking...' : 'Continue'}
                </button>
                {bookingError && (
                  <p className="text-sm text-red-500 mt-2">{bookingError}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-lg mx-auto"
            >
              <div className="bg-white rounded-2xl p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Consultation Scheduled!
                </h2>
                <p className="text-gray-600 mb-6">
                  Your video consultation has been booked successfully.
                </p>
                
                <div className="bg-cream-50 rounded-xl p-6 text-left mb-6">
                  <h3 className="font-medium text-gray-900 mb-4">Booking Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Expert</span>
                      <span className="font-medium">
                        {experts.find((e) => e.id === selectedExpert)?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date</span>
                      <span className="font-medium">{selectedDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Time</span>
                      <span className="font-medium">{selectedTime ? formatSlot(selectedTime) : selectedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Duration</span>
                      <span className="font-medium">30 minutes</span>
                    </div>
                  </div>
                </div>
                
                {bookedRoom && (
                  <p className="text-sm text-gray-500 mb-4">
                    Share this link with the expert to start the video call.
                  </p>
                )}
                
                <div className="flex flex-col gap-3">
                  {bookedRoom && (
                    <Link
                      href={`/${country}/consultation/${bookedRoom.roomId}`}
                      className="w-full py-3 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors text-center flex items-center justify-center gap-2"
                    >
                      <Play className="w-5 h-5" />
                      Join Video Call
                    </Link>
                  )}
                  <Link
                    href={`/${country}/collections`}
                    className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
                  >
                    Browse Collections
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </main>
  );
}
