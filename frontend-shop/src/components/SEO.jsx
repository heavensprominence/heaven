import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
    title, 
    description, 
    image, 
    url, 
    type = 'website',
    price,
    availability,
    condition,
    brand,
    sku
}) => {
    const siteTitle = 'HeavensLive Shop';
    const fullTitle = title ? `${title} - ${siteTitle}` : siteTitle;
    const defaultDescription = 'Divinely Inspired Marketplace - Buy and sell unique items, bid on auctions, and find great deals.';
    const defaultImage = 'https://heavenslive.com/shop-banner.png';
    
    const metaDescription = description || defaultDescription;
    const metaImage = image || defaultImage;
    const canonicalUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

    // Product schema for rich snippets
    const productSchema = price ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': title,
        'description': metaDescription,
        'image': metaImage,
        'sku': sku || title?.replace(/\s+/g, '-').toLowerCase(),
        'brand': brand ? { '@type': 'Brand', 'name': brand } : undefined,
        'offers': {
            '@type': 'Offer',
            'url': canonicalUrl,
            'priceCurrency': 'USD',
            'price': price,
            'availability': availability === 'in_stock' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            'itemCondition': condition ? `https://schema.org/${condition}Condition` : 'https://schema.org/NewCondition'
        }
    } : null;

    // Breadcrumb schema
    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
            {
                '@type': 'ListItem',
                'position': 1,
                'name': 'Home',
                'item': 'https://shop.heavenslive.com/'
            },
            {
                '@type': 'ListItem',
                'position': 2,
                'name': title || 'Listing',
                'item': canonicalUrl
            }
        ]
    };

    return (
        <Helmet>
            {/* Basic Meta */}
            <title>{fullTitle}</title>
            <meta name="description" content={metaDescription} />
            <link rel="canonical" href={canonicalUrl} />
            
            {/* Open Graph */}
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:image" content={metaImage} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:type" content={type === 'product' ? 'product' : 'website'} />
            {price && <meta property="og:price:amount" content={price.toString()} />}
            {price && <meta property="og:price:currency" content="USD" />}
            
            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={metaDescription} />
            <meta name="twitter:image" content={metaImage} />
            
            {/* Product Specific Meta */}
            {price && <meta name="twitter:label1" content="Price" />}
            {price && <meta name="twitter:data1" content={`$${price}`} />}
            {availability && <meta name="twitter:label2" content="Availability" />}
            {availability && <meta name="twitter:data2" content={availability === 'in_stock' ? 'In Stock' : 'Out of Stock'} />}
            
            {/* Schema.org Structured Data */}
            {productSchema && (
                <script type="application/ld+json">
                    {JSON.stringify(productSchema)}
                </script>
            )}
            
            <script type="application/ld+json">
                {JSON.stringify(breadcrumbSchema)}
            </script>
        </Helmet>
    );
};

export default SEO;
