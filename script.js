const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('#site-nav');

if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', () => {
        const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
        menuToggle.setAttribute('aria-expanded', String(!isExpanded));
        siteNav.classList.toggle('is-open', !isExpanded);
    });

    siteNav.addEventListener('click', (event) => {
        if (event.target instanceof HTMLAnchorElement) {
            menuToggle.setAttribute('aria-expanded', 'false');
            siteNav.classList.remove('is-open');
        }
    });
}

const currentYear = document.querySelector('#current-year');

if (currentYear) {
    currentYear.textContent = String(new Date().getFullYear());
}

const serviceRevealItems = document.querySelectorAll('.service-reveal');

if (serviceRevealItems.length > 0) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const formatCount = (value, suffix) => `${new Intl.NumberFormat().format(value)}${suffix}`;

    const showServiceItem = (item) => {
        item.classList.add('is-visible');

        const counter = item.querySelector('[data-count]');

        if (!counter || counter.dataset.counted === 'true') {
            return;
        }

        counter.dataset.counted = 'true';
        const target = Number(counter.dataset.count);
        const suffix = counter.dataset.suffix || '';

        if (!Number.isFinite(target) || prefersReducedMotion) {
            counter.textContent = formatCount(target, suffix);
            return;
        }

        const duration = 1200;
        const startTime = performance.now();
        const updateCount = (time) => {
            const progress = Math.min((time - startTime) / duration, 1);
            const easedProgress = 1 - (1 - progress) ** 3;
            counter.textContent = formatCount(Math.round(target * easedProgress), suffix);

            if (progress < 1) {
                window.requestAnimationFrame(updateCount);
            }
        };

        window.requestAnimationFrame(updateCount);
    };

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        serviceRevealItems.forEach(showServiceItem);
    } else {
        document.documentElement.classList.add('has-service-motion');
        const serviceObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    showServiceItem(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        serviceRevealItems.forEach((item) => serviceObserver.observe(item));
    }
}

const reportForm = document.querySelector('#report-filters');

if (reportForm instanceof HTMLFormElement) {
    const startDate = reportForm.querySelector('#start-date');
    const endDate = reportForm.querySelector('#end-date');
    const binFilter = reportForm.querySelector('#bin-filter');
    const filterMessage = document.querySelector('#filter-message');
    const recordCount = document.querySelector('#record-count');
    const binRows = Array.from(document.querySelectorAll('#bin-rows tr[data-bin]'));
    const trendRows = Array.from(document.querySelectorAll('#trend-rows tr[data-trend-date]'));
    const emptyBinRow = document.querySelector('#empty-bin-row');
    const emptyTrendRow = document.querySelector('#empty-trend-row');
    const summaryValues = {
        total: document.querySelector('[data-summary="total"]'),
        wet: document.querySelector('[data-summary="wet"]'),
        dry: document.querySelector('[data-summary="dry"]'),
        recyclable: document.querySelector('[data-summary="recyclable"]'),
        mixed: document.querySelector('[data-summary="mixed"]')
    };

    const applyReportFilters = () => {
        const from = startDate instanceof HTMLInputElement ? startDate.value : '';
        const to = endDate instanceof HTMLInputElement ? endDate.value : '';

        if (from && to && from > to) {
            if (filterMessage) {
                filterMessage.textContent = 'Start date must be on or before the end date.';
                filterMessage.classList.add('is-error');
            }
            if (startDate instanceof HTMLInputElement) {
                startDate.setAttribute('aria-invalid', 'true');
            }
            if (endDate instanceof HTMLInputElement) {
                endDate.setAttribute('aria-invalid', 'true');
            }
            return;
        }

        startDate?.removeAttribute('aria-invalid');
        endDate?.removeAttribute('aria-invalid');
        filterMessage?.classList.remove('is-error');

        const selectedBin = binFilter instanceof HTMLSelectElement ? binFilter.value : 'all';
        const totals = { total: 0, wet: 0, dry: 0, recyclable: 0, mixed: 0 };
        let visibleRecords = 0;

        binRows.forEach((row) => {
            const date = row.dataset.recordDate || '';
            const matchesDate = (!from || date >= from) && (!to || date <= to);
            const matchesBin = selectedBin === 'all' || row.dataset.bin === selectedBin;
            const isVisible = matchesDate && matchesBin;
            row.hidden = !isVisible;

            if (!isVisible) {
                return;
            }

            const kilograms = Number(row.dataset.kg);
            const type = row.dataset.type;

            if (!Number.isFinite(kilograms) || !(type in totals) || type === 'total') {
                return;
            }

            totals.total += kilograms;
            totals[type] += kilograms;
            visibleRecords += 1;
        });

        trendRows.forEach((row) => {
            const date = row.dataset.trendDate || '';
            row.hidden = Boolean((from && date < from) || (to && date > to));
        });

        const visibleTrends = trendRows.some((row) => !row.hidden);
        if (emptyTrendRow instanceof HTMLTableRowElement) {
            emptyTrendRow.hidden = visibleTrends;
        }
        if (emptyBinRow instanceof HTMLTableRowElement) {
            emptyBinRow.hidden = visibleRecords > 0;
        }

        Object.entries(summaryValues).forEach(([key, element]) => {
            if (element) {
                element.textContent = String(totals[key]);
            }
        });

        if (recordCount) {
            recordCount.textContent = `${visibleRecords} ${visibleRecords === 1 ? 'record' : 'records'}`;
        }

        if (filterMessage) {
            filterMessage.textContent = `Showing ${visibleRecords} of ${binRows.length} collection records. Trend reflects all bins within the selected dates.`;
        }
    };

    reportForm.addEventListener('submit', (event) => {
        event.preventDefault();
        applyReportFilters();
    });

    reportForm.addEventListener('reset', () => {
        window.requestAnimationFrame(applyReportFilters);
    });

    const printButton = document.querySelector('#print-report');
    printButton?.addEventListener('click', () => window.print());
}

const contactForm = document.querySelector('#contact-form');

if (contactForm instanceof HTMLFormElement) {
    const messageInput = contactForm.querySelector('#message');
    const messageCount = document.querySelector('#message-count');
    const formStatus = document.querySelector('#form-status');

    if (messageInput instanceof HTMLTextAreaElement && messageCount) {
        const updateMessageCount = () => {
            messageCount.textContent = `${messageInput.value.length} / ${messageInput.maxLength}`;
        };

        messageInput.addEventListener('input', updateMessageCount);
        updateMessageCount();
    }

    contactForm.addEventListener('submit', (event) => {
        event.preventDefault();

        if (formStatus) {
            formStatus.textContent = 'This demo cannot send messages yet. Please email support@smartwaste.com directly.';
        }
    });

    contactForm.addEventListener('reset', () => {
        if (formStatus) {
            formStatus.textContent = '';
        }
        window.requestAnimationFrame(() => {
            if (messageInput instanceof HTMLTextAreaElement && messageCount) {
                messageCount.textContent = `0 / ${messageInput.maxLength}`;
            }
        });
    });
}
