# Sanarch UI Design Reference

> **Source of Truth:** All designs come from `d:\sanarch\AppUI\new_ui\` directories.  
> Each section contains the **exact specifications** extracted from the HTML `code.html` files.  
> The React Native implementation in `d:\sanarch\app\` MUST match these specifications pixel-for-pixel.

---

## Table of Contents

1. [Splash Screen](#1-splash-screen)
2. [Onboarding](#2-onboarding)
3. [Login](#3-login)
4. [Setup Profile](#4-setup-profile)
5. [Home / Dashboard](#5-home--dashboard)
6. [Services](#6-services)
7. [Records](#7-records)
8. [Profile](#8-profile)
9. [Medical Scanner](#9-medical-scanner)
10. [Scan Analysis](#10-scan-analysis)
11. [Health Trackers](#11-health-trackers)
12. [Heart Rate](#12-heart-rate)
13. [Blood Sugar](#13-blood-sugar)
14. [Medications](#14-medications)
15. [Add Medication](#15-add-medication)
16. [Medication Reminder Popup](#16-medication-reminder-popup)
17. [Family Members](#17-family-members)
18. [Family Member Status](#18-family-member-status)
19. [Side Navigation Menu](#19-side-navigation-menu)
20. [Bottom Navigation Bar (Global)](#20-bottom-navigation-bar-global)

---

## 1. Splash Screen

**Source:** `splash_screen_updated_logo_image`  
**React Native File:** `app/index.tsx`

![Splash Screen](AppUI/new_ui/splash_screen_updated_logo_image/screen.png)

### Layout
- Full screen, centered content
- Background: solid `#006a35` (primary green)
- Logo: white "S" with leaf icon, centered vertically & horizontally
- Text "Sanarch" below logo: white, `Plus Jakarta Sans`, extrabold, ~3xl

### Animation
- Fade-in + Zoom-in (scale 0.5→1) over 1000ms
- Hold briefly
- Fade-out + Zoom-out over 500ms
- Navigate to `/onboarding`

### Key Specs
| Property | Value |
|----------|-------|
| Background | `#006a35` |
| Logo size | ~120×120px |
| Font | Plus Jakarta Sans, extrabold |
| Text color | `#ffffff` |

---

## 2. Onboarding

**Source:** `onboarding_right_aligned_action_button`  
**React Native File:** `app/onboarding.tsx`

![Onboarding](AppUI/new_ui/onboarding_right_aligned_action_button/screen.png)

### Layout
- **Top 65%**: Gradient background (`linear-gradient(135deg, #006a35 0%, #2ECC71 100%)`)
- **Bottom 35%**: White card overlapping upward with `rounded-t-[3rem]`

### Header (TopAppBar)
- Fixed/absolute at top, z-50
- Left: "Sanarch" — `Plus Jakarta Sans`, extrabold, white, text-2xl
- Right: Close button — `w-10 h-10`, `rounded-full`, `bg-white/10`, `backdrop-blur-md`
- Icon: `close` (Material Symbols), white
- Padding: `px-6 py-8`

### Doctor Image Container
- `relative w-full h-full max-w-lg`, items-end justify-center
- Image fills `h-[90%]`, `w-auto`, `object-contain`, `z-10`
- Drop shadow: `drop-shadow-[0_20px_50px_rgba(0,0,0,0.2)]`
- Rounded: `rounded-3xl`

### Floating Badges (3 pills)
- **"Save Time"**: `absolute -left-2 top-[32%]`
- **"Scan Anywhere"**: `absolute -right-4 top-[60%]`
- **"Stay Organised"**: `absolute -left-4 bottom-[25%]`
- All: `glass-pill` = `backdrop-filter: blur(8px); background: rgba(255, 255, 255, 0.9);`
- Shape: `px-4 py-2.5 rounded-full`, `shadow-[0_10px_30px_rgba(0,0,0,0.1)]`, z-20
- Icon circle: `w-6 h-6 rounded-full bg-primary-container`
- Icon: Material Symbols, 14px, `FILL 1`, color `on-primary-container`
- Text: `font-headline font-bold text-xs text-on-surface`

### Bottom Card
- Container: `relative h-[35%] w-full z-30`
- Card: `absolute -top-12 inset-x-0 bottom-0 bg-surface-container-lowest rounded-t-[3rem] px-8 pt-10 pb-8 flex flex-col justify-between`

### "Book Your Appointment" Button
- `bg-primary`, `text-on-primary`
- `py-3.5 px-8 rounded-full`
- `font-headline font-bold text-sm`
- `shadow-xl shadow-primary/20`
- Centered in a `flex-col items-center` container

### Main Text
- Headline: `font-headline font-extrabold text-3xl text-on-surface leading-tight tracking-tight`
- Text: "One App For All Your Healthcare Needs"
- Subtitle: `font-body text-on-surface-variant text-lg` — "Health made simpler."

### Next Button (Arrow)
- Container: `flex items-center mt-auto justify-end`
- Button: `w-14 h-14 rounded-full bg-on-surface`
- Icon: `arrow_forward`, `text-surface text-2xl`
- `shadow-lg` + `active:scale-95 transition-transform`
- **Right-aligned** (justify-end)

### Navigation
- `onPress` → navigate to `/login`

---

## 3. Login

**Source:** `sanarch_login_enlarged_logo_icon`  
**React Native File:** `app/login.tsx`

![Login](AppUI/new_ui/sanarch_login_enlarged_logo_icon/screen.png)

### Layout
- Full screen, `bg-surface`, centered content
- No nav bar

### Logo Section
- Centered: Sanarch "S" leaf icon + "Sanarch" text
- Icon: `w-10 h-10`, green leaf logo
- Text: `Plus Jakarta Sans`, `font-extrabold text-3xl text-on-surface`
- Gap between icon and text: `gap-3`

### Welcome Text
- "Welcome Back": `font-headline font-extrabold text-4xl text-on-surface`
- "Sign in to continue your health journey": `text-on-surface-variant text-base`
- Spacing: `mt-4 space-y-2`

### Form Card
- Container: `bg-surface-container-lowest rounded-3xl p-8 shadow-sm shadow-black/5`
- Margin top: `mt-10`

### Input Fields
- Label: `text-sm font-bold text-on-surface mb-2 font-body`
- Input: `w-full h-14 bg-surface-container-low rounded-xl px-4`
- Font: `text-on-surface font-medium font-body`
- Placeholder color: `#abadae`
- Focus: `border-2 border-primary`

### Sign In Button
- Full width, `h-14 rounded-full`
- Background: gradient `from-[#006a35] to-[#006946]` OR solid `bg-primary`
- Text: white, `font-bold text-base`, centered
- Icon: `arrow_forward`, white, right side
- Layout: `flex-row items-center justify-between px-6`
- Shadow: `shadow-[0_20px_50px_rgba(0,106,53,0.04)]`

### Social Login
- Two buttons side-by-side: Google + Apple
- Each: `flex-1 h-14 rounded-xl border border-outline-variant/10 bg-surface-container-lowest`
- `flex-row items-center justify-center gap-3`
- Text: `text-sm font-bold text-on-surface`

### Footer
- "Don't have an account? Sign Up"
- `text-on-surface-variant` + `text-primary font-bold`
- Bottom of screen

---

## 4. Setup Profile

**Source:** `set_up_your_profile` (new_ui version)  
**React Native File:** `app/setup-profile.tsx`

![Setup Profile](AppUI/new_ui/set_up_your_profile/screen.png)

### TopAppBar
- `fixed top-0 w-full z-50`
- Background: `bg-[#f5f7f8]/80 backdrop-blur-xl`
- Height: `h-16`
- Left: back arrow `arrow_back` icon
- Title: "Profile Setup" — `Plus Jakarta Sans`, bold, text-lg, `text-[#2c2f30]`

### Hero Section
- Padding top: `pt-24` (below fixed header)
- Headline: "Set up your profile!" — `font-headline font-extrabold text-3xl`
- Subtitle: `text-on-surface-variant leading-relaxed font-medium`
- Margin bottom: `mb-10`

### Form Fields
- Label style: `text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1`
- Input style: `w-full bg-surface-container-low border-none rounded-lg p-4`
- Focus: `ring-2 ring-primary/40` + `bg-surface-container-lowest`

### Gender Selection
- Three buttons: Male (active), Female, Other
- Active: `bg-primary text-on-primary font-semibold shadow-lg shadow-primary/20 rounded-lg`
- Inactive: `bg-surface-container-low text-on-surface font-semibold rounded-lg`
- Each has Material Symbols icon (`male`, `female`, `group`)
- `flex-1 min-w-[100px] py-3 px-4`

### Bottom Action Bar
- `fixed bottom-0 w-full z-50`
- Background: `bg-[#f5f7f8]/80 backdrop-blur-xl`
- Shadow: `shadow-[0_-4px_40px_rgba(0,0,0,0.06)]`
- Button: gradient `from-[#006a35] to-[#6bfe9c]`, `rounded-full`, `px-12 py-4`
- Text: "Next" + `check_circle` icon, white, `font-headline font-bold text-lg`

---

## 5. Home / Dashboard

**Source:** `home_refined_fab_shape`  
**React Native File:** `app/dashboard.tsx`

![Home](AppUI/new_ui/home_refined_fab_shape/screen.png)

### TopAppBar
- Height: `h-[56px]`
- Background: `bg-white/80 backdrop-blur-xl shadow-sm shadow-black/5`
- Left: Hamburger menu icon `menu`, size 26px, color `#747778`
- Center: "Home" — `Plus Jakarta Sans`, `text-[20px] font-semibold tracking-tight text-[#143832]`
- Right: Avatar — `h-[32px] w-[32px] rounded-full`, border, shadow-sm

### Welcome Hero Card
- Background: gradient `from-primary to-primary-dim`, `rounded-[2rem]`, `p-8`
- Badge: "VITAL STATISTICS" — uppercase, tracking-widest, text-xs, `text-on-primary/80`
- Headline: `Plus Jakarta Sans`, `text-4xl font-extrabold`, white
- Two buttons: "View Records" (`bg-primary-container`, `rounded-full`) + "Share Status" (`bg-white/20 border border-white/10`)
- Decorative: `absolute -right-10 -bottom-10 w-64 h-64 bg-primary-container opacity-20 rounded-full blur-3xl`

### Average Heart Rate Card
- `bg-surface-container-low rounded-[2rem] p-6`
- Icon: `favorite` (Material Symbols), `text-primary text-4xl`
- Label: "Average Heart Rate", `text-on-surface-variant font-semibold`
- Value: "72" — `text-5xl Plus Jakarta Sans font-extrabold`, "BPM" — `text-on-surface-variant font-medium`

### Quick Trackers Section
- Header: "Quick Trackers" + "View All" link
- 2×2 grid, `gap-4`
- Each card: `bg-surface-container-lowest p-6 rounded-[2rem] shadow-sm`
- Icon container: `w-12 h-12 rounded-2xl`
- Label: `text-xs font-bold uppercase tracking-wider`
- Value: `text-2xl Plus Jakarta Sans font-extrabold`
- Empty cards have dashed border: `border-2 border-dashed border-surface-container-high`

### Recently Tracked Widget
- Wrapper: `bg-surface-container-low rounded-[2rem] p-6`
- Inner card: `bg-surface-container-lowest rounded-2xl p-4 shadow-sm`
- Contains mini trend SVG line

### Appointment Card
- Outer: `bg-surface-container-low rounded-[2.5rem] p-1`
- Inner: `bg-surface-container-lowest rounded-[2.4rem] p-8`
- Doctor image: `w-32 h-32 rounded-[2rem] rotate-3 shadow-xl`
- Verified badge: `absolute -bottom-2 -right-2 bg-primary w-10 h-10 rounded-full border-4 border-white`
- "Remind Me" button: `bg-primary text-on-primary px-8 py-4 rounded-full font-bold shadow-lg`

### FAB (Floating Action Button)
- Position: `fixed bottom-28 right-6 z-50` (above nav bar)
- Shape: `w-[70px] h-[40px] rounded-[20px]`
- Background: gradient `from-green-700 to-green-400`
- Icon: `add` (Material Symbols), white, `text-2xl`, weight 600

---

## 6. Services

**Source:** `services_refined_header_alignment`  
**React Native File:** `app/services.tsx`

![Services](AppUI/new_ui/services_refined_header_alignment/screen.png)

### TopAppBar
- Same as Home: menu icon (left), "Services" title (center), avatar (right)
- Height: `h-[56px]`

### Hero Banner
- `bg-primary rounded-[2rem] p-8 overflow-hidden`
- Title: "How can we help you today?" — white, `font-extrabold text-3xl`
- Subtitle: `text-white/80 text-sm`
- Decorative icon in corner: large green cross faded

### Primary Care (Horizontal Scroll)
- Title: "Primary Care" — `font-bold text-xl`
- Cards: `min-w-[260px] bg-surface-container-lowest p-6 rounded-[2rem] shadow-sm`
- Each has icon, title, description

### Specialists (2-column grid)
- Cards: `bg-primary rounded-[2rem] p-6` or `bg-secondary-container rounded-[2rem] p-6`
- Tags: `bg-white/20 text-white text-[10px] font-bold uppercase rounded-full px-3 py-1`
- Title: white, `font-bold text-xl`
- Bottom icon: `text-white/20 text-5xl`

### Diagnostic Services
- List items: `bg-surface-container-low rounded-2xl p-5`
- Icon circle: colored, `w-14 h-14 rounded-2xl`
- Title + description text

---

## 7. Records

**Source:** `records_with_ai_insights`  
**React Native File:** `app/records.tsx`

![Records](AppUI/new_ui/records_with_ai_insights/screen.png)

### TopAppBar
- Same as Home/Services

### Search Bar
- `bg-surface-container-low rounded-full px-6 py-4`
- Search icon left, placeholder text

### Filter Chips (Horizontal Scroll)
- Active: `bg-primary text-on-primary rounded-full px-5 py-2 font-bold text-sm`
- Inactive: `bg-surface-container-low text-on-surface-variant rounded-full px-5 py-2`

### AI Insights Section
- Title: "✨ AI Insights" with sparkle icon
- Card: `bg-surface-container-lowest rounded-2xl p-6 shadow-sm`
- Data rows with large values and labels

### Latest Update Card
- `bg-primary rounded-[2rem] p-8`
- Badge: "LATEST UPDATE" — small pill
- Title: white, `font-extrabold text-3xl`
- "Download Report" button: `bg-white text-primary rounded-full`

### Blood Pressure Card
- Heart icon in colored circle
- Large value: "118/75"
- "NORMAL RANGE" label in green
- Bar chart visualization

### Recent Documents List
- Each item: icon circle + title + date + chevron-right
- `bg-surface-container-lowest rounded-2xl p-5`

---

## 8. Profile

**Source:** `profile_removed_plus_button`  
**React Native File:** `app/profile.tsx`

![Profile](AppUI/new_ui/profile_removed_plus_button/screen.png)

### TopAppBar
- Menu button (left), "Profile" title (center), notification bell (right)

### Profile Hero Card
- `bg-primary rounded-[2.5rem] p-8 pt-12`
- Avatar: `w-28 h-28 rounded-full border-4 border-white/20`
- Settings badge: `absolute bottom-1 right-1 bg-primary-container w-8 h-8 rounded-full`
- Name: white, `font-extrabold text-3xl`
- Patient ID: `text-white/70`
- Info pills: "BLOOD TYPE: O+" and "AGE: 29" — `bg-white/15 rounded-full px-4 py-2`

### Health Stats Grid (2×2)
- Each card: `bg-surface-container-lowest p-6 rounded-[2rem] shadow-sm`
- Icon + Label + Value
- Values: `text-4xl font-extrabold`

### Account Settings List
- Section label: "ACCOUNT SETTINGS" — uppercase, tracking-widest
- Each item: icon circle (`w-12 h-12 rounded-2xl`) + title + subtitle + chevron
- Items separated by `border-b border-outline-variant/10`

### Action Buttons
- "Update Profile": `bg-primary text-white rounded-2xl py-4 w-full shadow-lg`
- "Sign Out": `border border-error/20 text-error rounded-2xl py-4 w-full`

---

## 9. Medical Scanner

**Source:** `medical_scanner_refined_icon_size`  
**React Native File:** `app/scanner.tsx`

![Scanner](AppUI/new_ui/medical_scanner_refined_icon_size/screen.png)

### TopAppBar
- Menu icon (left), "Medical Scanner" (center), avatar (right)

### Hero Section
- "Add New Records" — `font-extrabold text-3xl`
- Subtitle: `text-on-surface-variant`

### Scan Document Card
- `bg-surface-container-lowest rounded-[2rem] p-8 shadow-sm`
- Icon: `document_scanner` (Material Symbols), `w-14 h-14 bg-primary rounded-2xl`
- Decorative camera icon: `absolute top-6 right-6`, large, faded
- Title: "Scan Document" — `font-bold text-2xl`
- Description text
- "Start Scanning →" link: `text-primary font-bold`

### Upload File Card
- Similar structure, `bg-surface-container-lowest`
- Icon: `cloud_upload`, `w-14 h-14 bg-primary-container rounded-2xl`
- "Browse Files 📁" link

### Recent Activity Section
- Accent bar: `w-1 h-8 bg-primary rounded-full`
- "Recent Activity" + "View All"
- List items with status badges:
  - "PROCESSED" — green pill
  - "COMPLETED" — gray pill
  - "Draft • Needs review" — error styling with `⚠` icon

---

## 10. Scan Analysis

**Source:** `medical_scanner_results`  
**React Native File:** `app/scan-analysis.tsx`

![Scan Analysis](AppUI/new_ui/medical_scanner_results/screen.png)

### TopAppBar
- Menu icon (left), "Scan Analysis" — `text-primary font-bold` (center), avatar (right)

### Document Preview
- `rounded-3xl overflow-hidden`, large image area
- Overlay: sparkle icon in circle + "Extraction 85% Complete" pill
- Progress bar: `bg-primary-container h-1.5 rounded-full` at bottom

### Extracted Data Section
- Title: "Extracted Data" + "Verified by AI" badge
- Cards: `bg-surface-container-low rounded-2xl p-5`
- Labels: uppercase, tracking-wider
- Values: `font-bold text-lg`

### Action Buttons
- "Save to Records": gradient button, `rounded-full`, centered
- "Back to Home": text link with home icon

### Key Findings
- Card: `bg-surface-container-low rounded-2xl p-6`
- Title: "📊 Key Findings"
- Rows: label + value with unit
- Values: `text-primary font-extrabold text-xl`

---

## 11. Health Trackers

**Source:** `health_trackers`  
**React Native File:** `app/health-trackers.tsx`

![Health Trackers](AppUI/new_ui/health_trackers/screen.png)

### TopAppBar
- Back arrow (left), "Health Trackers" — bold centered, "+" icon (right)

### Search Bar
- `bg-surface-container-low rounded-full px-6 py-4`
- Search icon + placeholder

### Active Metrics Header
- "Active Metrics" — `font-extrabold text-2xl`
- "UPDATED JUST NOW" — `text-on-surface-variant text-xs uppercase`

### Tracker Cards (2-column grid)
- Each: `bg-surface-container-lowest rounded-[2rem] p-6 border border-surface-container-high/30`
- Icon: colored circle (`w-12 h-12 rounded-2xl`)
- Status badge: "NORMAL" — `bg-primary-container/20 text-primary text-[10px] font-bold rounded-full px-3 py-1`
- Label: `font-semibold text-on-surface`
- Value: `text-4xl font-extrabold`
- "+" add button: `w-8 h-8 rounded-full bg-surface-container-high`

### Personalize Dashboard Banner
- `bg-primary rounded-[2rem] p-8`
- Title: white, `font-extrabold text-2xl`
- "Edit Trackers" button: `bg-white text-primary rounded-full px-6 py-3 font-bold`

---

## 12. Heart Rate

**Source:** `heart_rate_task_focused_view`  
**React Native File:** `app/heart-rate.tsx`

![Heart Rate](AppUI/new_ui/heart_rate_task_focused_view/screen.png)

### TopAppBar
- Back arrow (left), "Heart Rate" — `text-primary font-bold` (center), "⋮" menu (right)

### Main Reading Card
- `bg-surface-container-lowest rounded-[2.5rem] p-8 shadow-sm`
- Status pill: "NORMAL" — `bg-primary-container text-on-primary-container rounded-full px-6 py-2 font-bold text-sm`
- Value: "72" — `text-8xl font-extrabold`, "BPM" — `text-2xl`
- Subtitle: "Last checked 2 hours ago"

### Measure Now Button
- Gradient: `from-primary to-primary-container`
- `rounded-full py-4 px-10`
- Icon: `favorite` + "Measure Now"
- `shadow-lg shadow-primary/20`

### Trends Card
- `bg-surface-container-lowest rounded-[2rem] p-6`
- "Trends" title + "Last 7 days"
- Average pill: "Avg 74 BPM" — `bg-surface-container-low rounded-full px-4 py-2`
- Bar chart: 7 bars (Mon–Sun), varying heights
- Colors: lighter green for lower, darker green for higher

### History List
- "History" — `font-extrabold text-2xl`
- Items: `bg-surface-container-lowest rounded-2xl p-5`
- heart icon (`w-12 h-12 rounded-2xl bg-error/10`) + value + timestamp + chevron

---

## 13. Blood Sugar

**Source:** `blood_sugar_detail`  
**React Native File:** `app/blood-sugar.tsx`

![Blood Sugar](AppUI/new_ui/blood_sugar_detail/screen.png)

### TopAppBar
- Back arrow (left), "Blood Sugar" — bold centered, notification icon (right)

### Main Reading Card
- `bg-surface-container-lowest rounded-[2.5rem] p-8`
- Status: "NORMAL" pill (green)
- Value: "98" `text-8xl` + "mg/dL" `text-2xl`
- Subtitle: "Last checked 1 hour ago"

### Add New Reading Button
- Gradient: green gradient
- `rounded-full py-4`
- "+" icon + "Add New Reading"

### Health Insight Card
- `bg-surface-container-low rounded-2xl p-6`
- Blue icon circle
- "Health Insight" — bold
- Body text with **"Excellent work!"** highlighted

### Trends Section
- Title + Avg pill
- Bar chart (7 days)
- `bg-surface-container-lowest rounded-[2rem] p-6`

### Recent History List
- Items: drop icon circle + value + timestamp + chevron

---

## 14. Medications

**Source:** `medications_schedule_no_nav_bar`  
**React Native File:** `app/medications.tsx`

![Medications](AppUI/new_ui/medications_schedule_no_nav_bar/screen.png)

### TopAppBar
- Back arrow (left), "Medications" — `text-primary font-bold` (center), "+" icon (right)
- "+" button: `w-10 h-10 rounded-full bg-surface-container-low`

### Today's Schedule Header
- "Today's Schedule" — `font-extrabold text-3xl`
- Date: "Oct 24, 2023" — `text-on-surface-variant`

### Time Period Sections
- Label: ☀️ "MORNING (8:00 AM)" — uppercase, `text-primary font-bold text-xs tracking-widest`

### Medication Cards
- Container: `bg-surface-container-lowest rounded-2xl p-6 border-l-4 border-primary`
- Name: `font-bold text-xl`
- Instruction: `text-on-surface-variant text-sm` with fork-knife icon
- Badge: "REQUIRED" — `bg-primary-container/20 text-primary rounded-full px-3 py-1 text-[10px]`
- Or "DAILY" — `bg-tertiary-container/20 text-tertiary`
- Action buttons row:
  - "✓ Taken": `bg-primary text-white rounded-full px-6 py-2.5`
  - "Skip": `bg-surface-container-low rounded-full px-5 py-2.5`
  - "Snooze": `text-error bg-error/5 rounded-full px-5 py-2.5`

### Empty State
- `border-2 border-dashed rounded-2xl p-10`
- Pill icon, "No medications scheduled"

### Your Prescriptions
- Card: `bg-surface-container-lowest rounded-2xl p-6`
- Pill icon circle + name + frequency + days remaining
- Doctor avatar + "Prescribed by **Dr. Sharma**"
- "View Details →" link

---

## 15. Add Medication

**Source:** `add_medication_form_no_nav_bar`  
**React Native File:** `app/add-medication.tsx`

![Add Medication](AppUI/new_ui/add_medication_form_no_nav_bar/screen.png)

### TopAppBar
- Back arrow (left), "Add Medication" — bold centered

### Form Sections

#### General Information
- Section title: "GENERAL INFORMATION" — `uppercase tracking-widest text-xs font-bold text-on-surface-variant`
- Fields: Medicine Name, Dosage
- Input: `bg-surface-container-low rounded-xl p-4 pl-14`
- Icon circles: green medical icons

#### Dosing Schedule
- Card: `bg-surface-container-lowest rounded-2xl p-6`
- Frequency dropdown: "Twice daily"
- Time pickers: "08:00 AM" / "08:00 PM" with clock icons

#### Duration
- Toggle: "Ongoing" switch
- Date pickers: Start Date / End Date

#### Notes & Instructions
- Textarea: `rounded-2xl p-5 min-h-[120px]`

### Submit Button
- Gradient: `from-[#006a35] to-[#6bfe9c]`
- `rounded-full py-4 w-full`
- "✚ Add Medication" text, white, bold

---

## 16. Medication Reminder Popup

**Source:** `medication_reminder_popup`  
**React Native File:** `app/medications.tsx` (modal)

![Medication Reminder](AppUI/new_ui/medication_reminder_popup/screen.png)

### Overlay
- `bg-black/40 backdrop-blur-sm` full screen

### Modal Card
- `bg-white rounded-[2rem] p-8 mx-6`
- Close "×" button top-right

### Content
- Pill icon: large green gradient square with rounded corners (`rounded-[1.2rem]`)
- Title: "Time for your Medication" — `font-extrabold text-2xl text-center`
- Medication name pill: `bg-surface-container-low rounded-full px-6 py-2`

### Action Buttons
- "✓ Take Now": `bg-primary text-white rounded-full py-4 w-full font-bold`
- "⏱ Remind me in 15 mins": `bg-surface-container-low rounded-full py-3.5 w-full`

---

## 17. Family Members

**Source:** `family_members_centered_header`  
**React Native File:** `app/family-members.tsx`

![Family Members](AppUI/new_ui/family_members_centered_header/screen.png)

### TopAppBar
- Back arrow (left), "Family Members" — bold centered

### You (Primary) Section
- Header bar: `bg-surface-container-low`
- "YOU (PRIMARY)" label + green dot indicator
- Card: `bg-surface-container-lowest rounded-2xl p-6`
- Avatar circle with initials: `w-16 h-16 bg-primary rounded-full`
- Name, SMART-ID (green text)
- Stats: "23 Records" | "3 Active"
- "View Profile →" button

### Family Members Section
- Section label: "FAMILY MEMBERS"
- Cards with: avatar (initials, gray bg), name, SMART-ID, stats, "⋮" menu, "View Profile →"

### Add Family Member
- `border-2 border-dashed rounded-2xl p-8`
- "+" circle + "Add Family Member" + subtitle

---

## 18. Family Member Status

**Source:** `family_member_status`  
**React Native File:** `app/family-member-status.tsx`

![Family Member Status](AppUI/new_ui/family_member_status/screen.png)

### TopAppBar
- Back arrow, member name centered (green)

### Profile Header Card
- `bg-surface-container-lowest rounded-2xl p-6`
- Avatar + name + "Dependent" badge + SMART-ID + member since

### Health Overview (2×2 Grid)
- Cards: `bg-surface-container-lowest rounded-2xl p-6`
- Each: label (uppercase) + large value + status text (colored)

### Current Medications
- Card with pill icons + medication names + schedules + ℹ️ buttons

### Recent Records
- List items with icon circles + document names + dates + sizes + chevrons

### Upload New Record Button
- `border-2 border-dashed rounded-2xl py-4`
- "⊕ Upload New Record"

---

## 19. Side Navigation Menu

**Source:** `sanarch_side_navigation_menu`  
**React Native File:** `app/dashboard.tsx` (Modal drawer)

![Side Navigation](AppUI/new_ui/sanarch_side_navigation_menu/screen.png)

### Overlay
- `bg-black/30` behind the drawer

### Drawer
- Width: `w-80` (320px)
- Background: `bg-slate-50`
- `rounded-r-[40px]` on right edge
- `shadow-2xl`

### Header
- "Sanarch" text: `text-2xl font-bold text-[#064e3b]`
- Close "×" button: `p-2 bg-slate-200/50 rounded-full`

### Menu Items
- Active item (Home): `bg-[#d1fae5] rounded-2xl px-5 py-4`
  - Icon: `home`, filled, `text-[#065f46]`
  - Text: `font-semibold text-sm text-[#065f46]`
- Inactive items: `bg-transparent rounded-2xl px-5 py-4`
  - Icon color: `#475569`
  - Text: `text-[#475569]`

### Items List
1. Home (active)
2. Add Family Members
3. My Medication
4. Settings

### Footer
- "Sign Out" button at bottom: `border border-slate-200 rounded-2xl py-4`
- Logout icon + text

---

## 20. Bottom Navigation Bar (Global)

**Appears on:** Home, Services, Records, Profile, Health Trackers

### Container
- Position: `fixed bottom-0 w-full z-50`
- `rounded-t-[24px]`
- Background: `bg-white/90 backdrop-blur-2xl`
- Shadow: `shadow-[0_-4px_40px_rgba(0,0,0,0.06)]`

### Tab Items
- **4 tabs**: Home, Services, Records, Profile
- Each tab: `flex-col items-center justify-center`

### Active Tab Style
- Shape: `w-[70px] h-[40px] rounded-[20px]`
- Background: gradient `from-green-700 to-green-400`
- Icon: white, Material Symbols, filled (`FILL 1`)
- Label: `text-[10px] font-semibold uppercase tracking-wider`, white

### Inactive Tab Style
- Size: `w-[70px] h-[40px]`
- Icon: `#a3a3a3` (neutral-400)
- Label: `text-[10px] font-semibold uppercase tracking-wider`, `text-neutral-400`

### Spacing
- Padding: `px-4 pt-3 pb-8` (or `pb-safe` for safe area)
- `flex-row justify-around items-center`

### Key Design Notes
- The active indicator is a **rounded rectangle (stadium/pill)** — NOT a circle
- The gradient goes from darker green to lighter green diagonally
- Shadow on active tab: `shadow-lg shadow-green-500/20`
- Transition: `active:scale-90 duration-300 ease-out`
- Bottom padding must respect safe area insets

---

## Color Palette Reference

| Token | Hex |
|-------|-----|
| `primary` | `#006a35` |
| `primary-dim` | `#005c2d` |
| `primary-container` | `#6bfe9c` |
| `on-primary` | `#cdffd4` |
| `on-primary-container` | `#005f2f` |
| `secondary` | `#006946` |
| `secondary-container` | `#72fbbd` |
| `tertiary` | `#006576` |
| `tertiary-container` | `#00dcff` |
| `error` | `#b31b25` |
| `error-container` | `#fb5151` |
| `surface` | `#f5f7f8` |
| `surface-container-lowest` | `#ffffff` |
| `surface-container-low` | `#eef1f2` |
| `surface-container` | `#e5e9ea` |
| `surface-container-high` | `#dfe3e4` |
| `surface-container-highest` | `#d9dddf` |
| `on-surface` | `#2c2f30` |
| `on-surface-variant` | `#595c5d` |
| `outline` | `#747778` |
| `outline-variant` | `#abadae` |
| `inverse-surface` | `#0b0f10` |
| `inverse-on-surface` | `#9a9d9e` |

## Typography Reference

| Token | Font Family |
|-------|-------------|
| `font-headline` | Plus Jakarta Sans |
| `font-body` | Inter |
| `font-label` | Inter |

## Border Radius Reference

| Token | Value |
|-------|-------|
| `DEFAULT` | `0.25rem` (4px) |
| `lg` | `0.5rem` (8px) |
| `xl` | `0.75rem` (12px) |
| `full` | `9999px` |

---

> **Note:** All button shapes must be rounded-full (pill) or as specified. No square edges are acceptable in this design system.
