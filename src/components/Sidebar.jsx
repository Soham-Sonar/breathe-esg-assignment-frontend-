// components/Sidebar.jsx

const NAV_ITEMS = [

  { id: "dashboard", icon: "📊", label: "Dashboard" },

  { id: "review", icon: "✅", label: "Review Records" },

  { id: "upload", icon: "📤", label: "Upload Data" },

  { id: "history", icon: "🕓", label: "Upload History" },

  { id: "failed", icon: "⚠️", label: "Failed Rows" },

];


export default function Sidebar({

  currentPage,

  onNavigate,

  pendingCount,

  failedCount,

  companies = [],

  companyId = "",

  onCompanyChange,

}) {

  return (

    <div className="sidebar">


      {/* Logo */}

      <div className="sidebar-logo">

        <div className="logo-mark">

          🌿 Breathe ESG

        </div>

        <div className="logo-sub">

          Carbon Ingestion Platform

        </div>

      </div>



      {/* Company Selector */}

      <div className="company-selector">

        <div className="company-label">

          Company

        </div>

        <select

          className="company-dropdown"

          value={companyId}

          onChange={(e)=>{

            if(onCompanyChange){

              onCompanyChange(

                e.target.value

              )

            }

          }}

        >

          {companies.length===0 ? (

            <option value="">

              Loading...

            </option>

          ) : (

            companies.map((company)=>(

              <option

                key={company.id}

                value={company.id}

              >

                {company.name}

              </option>

            ))

          )}

        </select>

      </div>



      {/* Navigation */}

      <div className="sidebar-nav">

        {NAV_ITEMS.map((item)=>{

          const badge =

            item.id==="review"

              ? pendingCount>0

                ? pendingCount

                : null

              : item.id==="failed"

              ? failedCount>0

                ? failedCount

                : null

              : null;

          return (

            <button

              key={item.id}

              className={`nav-item ${

                currentPage===item.id

                  ? "active"

                  : ""

              }`}

              onClick={()=>onNavigate(item.id)}

            >

              <span className="nav-icon">

                {item.icon}

              </span>

              {item.label}

              {badge && (

                <span className="nav-badge">

                  {badge}

                </span>

              )}

            </button>

          )

        })}

      </div>



      {/* Footer */}

      <div className="sidebar-footer">

        v1.0

      </div>

    </div>

  )

}