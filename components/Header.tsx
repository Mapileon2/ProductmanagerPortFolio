
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../App';
import { View } from '../types';

interface HeaderProps {
    navigateTo: (view: View, caseStudyId?: string) => void;
    isTransparent?: boolean;
}

const Header: React.FC<HeaderProps> = ({ navigateTo, isTransparent = false }) => {
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const auth = useContext(AuthContext);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navClass = isTransparent && !isScrolled && !isMobileMenuOpen
        ? 'bg-transparent text-white'
        : 'bg-white/90 dark:bg-gray-800/90 shadow-md backdrop-blur-sm';
    
    const linkClass = isTransparent && !isScrolled && !isMobileMenuOpen
        ? "text-white hover:text-yellow-300"
        : "text-gray-800 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-300";

    const handleNav = (view: View) => {
        navigateTo(view);
        setMobileMenuOpen(false);
    };

    return (
        <nav className={`fixed w-full z-40 transition-all duration-300 ${navClass}`}>
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex justify-between items-center py-4">
                    <div
                        className="ghibli-font text-2xl cursor-pointer text-blue-600 dark:text-blue-300"
                        onClick={() => handleNav('home')}
                    >
                        <span className="text-yellow-500">★</span> Arpan's Product Journey
                    </div>
                    <div className="hidden md:flex items-center space-x-8">
                        <a href="#about" onClick={(e) => { e.preventDefault(); handleNav('home'); setTimeout(() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className={linkClass}>About</a>
                        <a href="#projects" onClick={(e) => { e.preventDefault(); handleNav('home'); setTimeout(() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className={linkClass}>Projects</a>
                        <button onClick={() => handleNav('blog')} className={linkClass}>Blog</button>
                        <a href="#cv" onClick={(e) => { e.preventDefault(); handleNav('home'); setTimeout(() => document.getElementById('cv')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className={linkClass}>CV</a>
                        <a href="#contact" onClick={(e) => { e.preventDefault(); handleNav('home'); setTimeout(() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className={linkClass}>Contact</a>
                        {auth?.user && (
                             <button onClick={() => handleNav('admin')} className={`${linkClass} font-semibold`}>Admin Panel</button>
                        )}
                         {auth?.user ? (
                           <button onClick={auth.logout} className={`${linkClass} font-semibold`}>Logout</button>
                        ) : (
                           <div className="flex items-center gap-4">
                               <button onClick={() => handleNav('login')} className={`${linkClass} font-semibold`}>Login</button>
                               <button onClick={() => handleNav('login')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold shadow transition hover:scale-105">Create Your Portfolio</button>
                           </div>
                        )}
                    </div>
                    <div className="md:hidden">
                        <button onClick={() => setMobileMenuOpen(!isMobileMenuOpen)} className="focus:outline-none">
                            <i className={`fas fa-bars text-2xl ${linkClass}`}></i>
                        </button>
                    </div>
                </div>
            </div>
            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                 <div className="md:hidden bg-white dark:bg-gray-800 py-2 px-4 shadow-lg">
                    <a href="#about" onClick={(e) => { e.preventDefault(); handleNav('home'); setTimeout(() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="block py-2 text-gray-800 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-300">About</a>
                    <a href="#projects" onClick={(e) => { e.preventDefault(); handleNav('home'); setTimeout(() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="block py-2 text-gray-800 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-300">Projects</a>
                    <button onClick={() => handleNav('blog')} className="block w-full text-left py-2 text-gray-800 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-300">Blog</button>
                    <a href="#cv" onClick={(e) => { e.preventDefault(); handleNav('home'); setTimeout(() => document.getElementById('cv')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="block py-2 text-gray-800 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-300">CV</a>
                    <a href="#contact" onClick={(e) => { e.preventDefault(); handleNav('home'); setTimeout(() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="block py-2 text-gray-800 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-300">Contact</a>
                    {auth?.user && (
                         <button onClick={() => handleNav('admin')} className="block w-full text-left py-2 font-semibold text-gray-800 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-300">Admin Panel</button>
                    )}
                    {auth?.user ? (
                       <button onClick={auth.logout} className="block w-full text-left py-2 font-semibold text-gray-800 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-300">Logout</button>
                    ) : (
                       <>
                           <button onClick={() => handleNav('login')} className="block w-full text-left py-2 font-semibold text-gray-800 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-300">Login</button>
                           <button onClick={() => handleNav('login')} className="block w-full text-left py-2 font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">Create Your Portfolio</button>
                       </>
                    )}
                 </div>
            )}
        </nav>
    );
};

export default Header;
