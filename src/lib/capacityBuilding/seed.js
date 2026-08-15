const now = () => new Date().toISOString();

function item(group, code, trainingSubject, extra) {
  return {
    id: `cb-${code.replace(/[^a-zA-Z0-9]+/g, "-").replace(/-+$/g, "")}`,
    moduleGroupCode: group.code,
    moduleGroupName: group.name,
    moduleCode: code,
    trainingSubject,
    interventionType: extra.interventionType,
    participantType: extra.participantType,
    placeLevel: extra.placeLevel,
    daysPerEvent: extra.daysPerEvent,
    plannedEvents: extra.plannedEvents,
    plannedParticipants: extra.plannedParticipants,
    createdAt: now(),
    updatedAt: now(),
  };
}

const GROUPS = {
  1: {
    code: "BTASP-1",
    name: "BTASP 1 - Capacity Building for Territorial Forest Department",
  },
  2: {
    code: "BTASP-2",
    name: "BTASP 2 - Para-Professional Staff (Deputy Ranger , Forester, FFEs, Forest Guard)",
  },
  3: {
    code: "BTASP-3",
    name: "BTASP 3 - Capacity Building for CEDGAD (Peshawar)",
  },
  4: {
    code: "BTASP-4",
    name: "BTASP 4 - Capacity Building for Community Organisations",
  },
  5: {
    code: "BTASP-5",
    name: "BTASP 5 - Capacity Building of Direct Beneficiaries",
  },
  6: {
    code: "BTASP-6",
    name: "BTASP 6 - Training for PMU project managers",
  },
  7: {
    code: "BTASP-7",
    name: "BTASP 7 - Exchange visits",
  },
  8: {
    code: "BTASP-8",
    name: "BTASP 8 - Operational Meetings & Workshops",
  },
  9: {
    code: "BTASP-9",
    name: "BTASP 9 - Management Information System",
  },
};

export function createSeedCapacityPlanItems() {
  return [
    item(GROUPS[1], "BTASP-1.1", "Understanding of project outputs and Interventions", {
      interventionType: "Workshop",
      participantType: "Conservator to SDFOs",
      placeLevel: "Regional level",
      daysPerEvent: 1,
      plannedEvents: 2,
      plannedParticipants: 50,
    }),
    item(GROUPS[1], "BTASP-1.2", "Training on Financial reporting and compliance of BTASP", {
      interventionType: "Workshop and on the job training",
      participantType: "DFO & Accountants of DFO Office",
      placeLevel: "Regional level",
      daysPerEvent: 2,
      plannedEvents: 2,
      plannedParticipants: 52,
    }),
    item(GROUPS[1], "BTASP-1.3", "Project Management and Cycle", {
      interventionType: "Workshop",
      participantType: "CCF, CF and DFO",
      placeLevel: "Provincial level",
      daysPerEvent: 2,
      plannedEvents: 1,
      plannedParticipants: 22,
    }),
    item(GROUPS[1], "BTASP-1.4", "Monitoring and evaluation of project intervention", {
      interventionType: "On the job training",
      participantType: "Field Staff of DFO Office",
      placeLevel: "Regional level",
      daysPerEvent: 2,
      plannedEvents: 2,
      plannedParticipants: 48,
    }),
    item(GROUPS[1], "BTASP-1.5", "Use of GPS and GIS technology in NRM", {
      interventionType: "On the job training",
      participantType: "DFO and SDFOs",
      placeLevel: "Regional level",
      daysPerEvent: 2,
      plannedEvents: 2,
      plannedParticipants: 50,
    }),
    item(GROUPS[1], "BTASP-1.6", "Training on BTASP Implementation Guidelines", {
      interventionType: "Workshop and on the job training",
      participantType: "DFO and SDFOs",
      placeLevel: "Regional level",
      daysPerEvent: 2,
      plannedEvents: 2,
      plannedParticipants: 50,
    }),
    item(GROUPS[1], "BTASP-1.7", "Forest Fire Prevention & Fire Management", {
      interventionType: "Workshop / Practical Training / Equipment",
      participantType: "Staff of DFO Office",
      placeLevel: "Circle level",
      daysPerEvent: 2,
      plannedEvents: 3,
      plannedParticipants: 75,
    }),
    item(GROUPS[1], "BTASP-1.8", "ESMF, Tools + Implementation + reporting", {
      interventionType: "Workshop / Practical Training",
      participantType: "CF, DFO and SDFO",
      placeLevel: "Regional level",
      daysPerEvent: 2,
      plannedEvents: 2,
      plannedParticipants: 60,
    }),
    item(GROUPS[1], "BTASP-1.9", "Community Mobilisation and PRA tools", {
      interventionType: "Workshop / Practical Training",
      participantType: "DFO + CDOs",
      placeLevel: "Provincial level",
      daysPerEvent: 2,
      plannedEvents: 2,
      plannedParticipants: 60,
    }),
    item(
      GROUPS[1],
      "BTASP-1.10",
      "Report Writing Preparation of Participatory Forestry Resource Management Plan (PFRMP)",
      {
        interventionType: "Workshop",
        participantType: "DFO, SDFO and CDO",
        placeLevel: "Regional level",
        daysPerEvent: 2,
        plannedEvents: 2,
        plannedParticipants: 52,
      }
    ),
    item(GROUPS[1], "BTASP-1.11", "Conflict Management, DO NO Harm- approach", {
      interventionType: "Workshop",
      participantType: "DFO and CDOs",
      placeLevel: "Provincial level",
      daysPerEvent: 1,
      plannedEvents: 1,
      plannedParticipants: 26,
    }),
    item(
      GROUPS[1],
      "BTASP-1.12",
      "Climate Change Adaptation and Mitigation - with special focus on communal forest interventions",
      {
        interventionType: "Workshop",
        participantType: "CF, DFO",
        placeLevel: "Provincial level",
        daysPerEvent: 2,
        plannedEvents: 1,
        plannedParticipants: 25,
      }
    ),
    item(GROUPS[1], "BTASP-1.13", "Rangeland mgt., Sustainable Community Forestry,", {
      interventionType: "Workshop / Practical Training",
      participantType: "DFO & SDFO",
      placeLevel: "Regional level",
      daysPerEvent: 2,
      plannedEvents: 2,
      plannedParticipants: 50,
    }),

    item(GROUPS[2], "BTASP-2.1", "Forest Fire Management", {
      interventionType: "On the job training",
      participantType: "Forester + F Guard+ CDOs + VDC/WO",
      placeLevel: "Regional level",
      daysPerEvent: 2,
      plannedEvents: 2,
      plannedParticipants: 60,
    }),
    item(GROUPS[2], "BTASP-2.2", "E&S Safeguards tools, risk assessments & reporting", {
      interventionType: "Workshop / Practical Training",
      participantType: "Forester + F Guard+ CDOs + VDC/WO",
      placeLevel: "Regional Level",
      daysPerEvent: 2,
      plannedEvents: 2,
      plannedParticipants: 60,
    }),
    item(
      GROUPS[2],
      "BTASP-2.3",
      "Plantation & Nursery raising & management according to BTASP implementation guidelines",
      {
        interventionType: "On the job training",
        participantType: "Forester + F Guard+ CDOs + VDC/WO",
        placeLevel: "Regional Level",
        daysPerEvent: 2,
        plannedEvents: 2,
        plannedParticipants: 60,
      }
    ),
    item(
      GROUPS[2],
      "BTASP-2.4",
      "Basic Forestry (Sustainable Management of Communal Forest) Forest Inventory",
      {
        interventionType: "On the job training",
        participantType: "Forester + F Guard+ CDOs + VDC/WO",
        placeLevel: "Regional Level",
        daysPerEvent: 4,
        plannedEvents: 2,
        plannedParticipants: 60,
      }
    ),
    item(GROUPS[2], "BTASP-2.5", "Accounts & Procedure", {
      interventionType: "On the job training",
      participantType: "Accountant and Clerical Staff of DFO Office",
      placeLevel: "Regional Level",
      daysPerEvent: 2,
      plannedEvents: 2,
      plannedParticipants: 60,
    }),
    item(
      GROUPS[2],
      "BTASP-2.6",
      "Climate Change Adaptation and Mitigation - with special focus on communal forest interventions",
      {
        interventionType: "Workshop/Practical Sessions",
        participantType: "Forester + F Guard+ CDOs + VDC/WO",
        placeLevel: "Regional Level",
        daysPerEvent: 1,
        plannedEvents: 2,
        plannedParticipants: 60,
      }
    ),
    item(GROUPS[2], "BTASP-2.7", "Refresher on seed collection, storage and quality control", {
      interventionType: "On the job training",
      participantType: "Forester + F Guard+ VDC/WO",
      placeLevel: "Regional Level",
      daysPerEvent: 1,
      plannedEvents: 2,
      plannedParticipants: 60,
    }),

    item(GROUPS[3], "BTASP-3.1", "PRA, Communication training for CEDGAD", {
      interventionType: "On the job training",
      participantType: "AD & CDOs",
      placeLevel: "Regional level",
      daysPerEvent: 3,
      plannedEvents: 2,
      plannedParticipants: 50,
    }),
    item(GROUPS[3], "BTASP-3.2", "Training on FPIC and ESMF process for CEDGAD", {
      interventionType: "Workshop / Practical Training",
      participantType: "AD & CDOs",
      placeLevel: "Regional level",
      daysPerEvent: 2,
      plannedEvents: 2,
      plannedParticipants: 50,
    }),
    item(GROUPS[3], "BTASP-3.3", "Risk Assessment and Mitigation Measures", {
      interventionType: "Workshop / Practical Training",
      participantType: "AD & CDOs",
      placeLevel: "Provincial level",
      daysPerEvent: 1,
      plannedEvents: 1,
      plannedParticipants: 25,
    }),

    item(GROUPS[4], "BTASP-4.1 (a)", "Community Management & Leadership Skills (CMLST)", {
      interventionType: "On the job training",
      participantType: "VDC Office Bearers",
      placeLevel: "PU Level",
      daysPerEvent: 2,
      plannedEvents: 100,
      plannedParticipants: 1000,
    }),
    item(GROUPS[4], "BTASP-4.1 (b)", "Community Management & Leadership Skills (CMLST)", {
      interventionType: "On the job training",
      participantType: "WO Office Bearers",
      placeLevel: "PU Level",
      daysPerEvent: 2,
      plannedEvents: 100,
      plannedParticipants: 1000,
    }),
    item(GROUPS[4], "BTASP-4.2", "FPIC, ESMF & GRM Basic understanding", {
      interventionType: "Sessions",
      participantType: "VDC/WO (13 events for men and 13 for Women)",
      placeLevel: "Divisional Level",
      daysPerEvent: 1,
      plannedEvents: 26,
      plannedParticipants: 780,
    }),
    item(GROUPS[4], "BTASP-4.3", "Training on Local NTFPs (Pre and Post Harvest Training)", {
      interventionType: "On the job training",
      participantType: "NTFPs collectors",
      placeLevel: "PU Level",
      daysPerEvent: 2,
      plannedEvents: 100,
      plannedParticipants: 2000,
    }),
    item(GROUPS[4], "BTASP-4.4", "NTFP's value addition of the six selected NTFPs", {
      interventionType: "Workshop and on the job training",
      participantType: "NTFPs Directorate and Local Entrepreneurs",
      placeLevel: "Regional level",
      daysPerEvent: 3,
      plannedEvents: 2,
      plannedParticipants: 50,
    }),
    item(
      GROUPS[4],
      "BTASP-4.5",
      "Spring shed Management (6 days training in 3 sessions, Each session 2 days)",
      {
        interventionType: "On the job training",
        participantType: "Forest Guard + Forest Warden + VDC Representative",
        placeLevel: "Divisional Level",
        daysPerEvent: 2,
        plannedEvents: 39,
        plannedParticipants: 780,
      }
    ),
    item(
      GROUPS[4],
      "BTASP-4.6",
      "Climate Change Adaptation and Mitigation - with special focus on communal forest interventions",
      {
        interventionType: "TOT training VDC and WO",
        participantType: "Forest Guard + Forest Warden + VDC Representative",
        placeLevel: "Circle level",
        daysPerEvent: 2,
        plannedEvents: 3,
        plannedParticipants: 60,
      }
    ),
    item(
      GROUPS[4],
      "BTASP-4.7",
      "Basic Forestry (Sustainable Management of Communal Forest) (6 days training in 3 sessions, Each session 2 days)",
      {
        interventionType: "On the job training",
        participantType: "Forest Guard + Forest Warden + VDC Representative",
        placeLevel: "Divisional Level",
        daysPerEvent: 4,
        plannedEvents: 39,
        plannedParticipants: 975,
      }
    ),

    item(GROUPS[5], "BTASP-5.1", "Nursery raising and Management", {
      interventionType: "On the job training",
      participantType: "Nursery owners/ operatives",
      placeLevel: "Divisional Level",
      daysPerEvent: 2,
      plannedEvents: 13,
      plannedParticipants: 325,
    }),
    item(GROUPS[5], "BTASP-5.2", "Roles & Responsibilities of Community Wardens", {
      interventionType: "On the job training",
      participantType: "Community Wardens",
      placeLevel: "Divisional Level",
      daysPerEvent: 2,
      plannedEvents: 13,
      plannedParticipants: 390,
    }),
    item(GROUPS[5], "BTASP-5.3", "Women Livelihood improvement", {
      interventionType: "On the job training",
      participantType: "WO Nominations",
      placeLevel: "Circle level",
      daysPerEvent: 2,
      plannedEvents: 4,
      plannedParticipants: 120,
    }),
    item(GROUPS[5], "BTASP-5.4", "Grafting & Fruit Orchard (For Potential PUs only)", {
      interventionType: "On the job training",
      participantType: "VDC/WO Nominations",
      placeLevel: "Circle level",
      daysPerEvent: 2,
      plannedEvents: 4,
      plannedParticipants: 120,
    }),
    item(GROUPS[5], "BTASP-5.5", "Apiculture (For Potential PUs only)", {
      interventionType: "On the job training",
      participantType: "VDC/WO Nominations",
      placeLevel: "Circle level",
      daysPerEvent: 2,
      plannedEvents: 4,
      plannedParticipants: 120,
    }),
    item(GROUPS[5], "BTASP-5.6", "Handicraft (For Potential PUs only)", {
      interventionType: "On the job training",
      participantType: "WO Nominations",
      placeLevel: "Circle level",
      daysPerEvent: 2,
      plannedEvents: 4,
      plannedParticipants: 120,
    }),

    item(GROUPS[6], "BTASP-6.1", "Project administration, Procedure and Reporting", {
      interventionType: "Workshop",
      participantType: "CCF/ PMU /PIC/",
      placeLevel: "Provincial Level",
      daysPerEvent: 2,
      plannedEvents: 1,
      plannedParticipants: 15,
    }),
    item(GROUPS[6], "BTASP-6.2", "ESMF, Tools + Implementation + reporting GRM Mgt.", {
      interventionType: "Workshop",
      participantType: "CCF/ PMU /PIC/",
      placeLevel: "Provincial Level",
      daysPerEvent: 1,
      plannedEvents: 1,
      plannedParticipants: 15,
    }),
    item(
      GROUPS[6],
      "BTASP-6.3",
      "Climate Change Adaptation and Mitigation - with special focus on communal forest interventions",
      {
        interventionType: "Workshop",
        participantType: "CCF/ PMU /PIC/",
        placeLevel: "Provincial Level",
        daysPerEvent: 1,
        plannedEvents: 1,
        plannedParticipants: 15,
      }
    ),
    item(GROUPS[6], "BTASP-6.4", "Leadership and International Project Management", {
      interventionType: "Workshop",
      participantType: "DFO / PMU",
      placeLevel: "Provincial Level",
      daysPerEvent: 2,
      plannedEvents: 1,
      plannedParticipants: 10,
    }),
    item(GROUPS[6], "BTASP-6.5", "Internation project management and Implementation", {
      interventionType: "Workshop",
      participantType: "CF/ DFO / PMU",
      placeLevel: "Provincial Level",
      daysPerEvent: 2,
      plannedEvents: 1,
      plannedParticipants: 10,
    }),
    item(GROUPS[6], "BTASP-6.6", "KfW Tender procedures", {
      interventionType: "Workshop",
      participantType: "PMU /PIC",
      placeLevel: "Provincial Level",
      daysPerEvent: 1,
      plannedEvents: 1,
      plannedParticipants: 15,
    }),
    item(GROUPS[6], "BTASP-6.7", "Training on Accounting Software (ERP)", {
      interventionType: "Workshop/On the job training",
      participantType: "PIC",
      placeLevel: "Regional level",
      daysPerEvent: 2,
      plannedEvents: 3,
      plannedParticipants: 75,
    }),

    item(GROUPS[7], "BTASP-7.1", "Exchange visits VDC/WO to Model villages in KP", {
      interventionType: "Exchange visit",
      participantType: "VDC and WO",
      placeLevel: "Provincial level",
      daysPerEvent: 1,
      plannedEvents: 10,
      plannedParticipants: 100,
    }),
    item(GROUPS[7], "BTASP-7.2", "Exchange visits community forest mgt and fire prevention", {
      interventionType: "Exchange visit",
      participantType: "DFOs/PMU",
      placeLevel: "Provincial level",
      daysPerEvent: 7,
      plannedEvents: 1,
      plannedParticipants: 20,
    }),
    item(GROUPS[7], "BTASP-7.3", "Exchange visits NTFP's value addition", {
      interventionType: "Exchange Visit",
      participantType: "DFOs/PMU",
      placeLevel: "Provincial level",
      daysPerEvent: 7,
      plannedEvents: 1,
      plannedParticipants: 20,
    }),
    item(
      GROUPS[7],
      "BTASP-7.4",
      "Exchange visits DFOs/SDFO & CDOs with other terrestrials’ teams (DFOs) 3x a year",
      {
        interventionType: "Exchange visit",
        participantType: "DFO/SDFO/CDO",
        placeLevel: "Divisional Level",
        daysPerEvent: 4,
        plannedEvents: 3,
        plannedParticipants: 60,
      }
    ),
    item(GROUPS[7], "BTASP-7.5", "Exchange visit international KfW forest project", {
      interventionType: "Exchange visit",
      participantType: "DFO/PMU",
      placeLevel: "international",
      daysPerEvent: 10,
      plannedEvents: 1,
      plannedParticipants: 12,
    }),

    item(GROUPS[8], "BTASP-8.1", "Steering committee meetings", {
      interventionType: "Meetings",
      participantType: "PMU, CF, CCF, Director ISU",
      placeLevel: "Provincial level",
      daysPerEvent: 1,
      plannedEvents: 4,
      plannedParticipants: 40,
    }),
    item(GROUPS[8], "BTASP-8.2", "Bi-annual progress review / visits in one Division", {
      interventionType: "Meetings",
      participantType: "PMU, DFO, PIC, CF, ISU",
      placeLevel: "Provincial level",
      daysPerEvent: 1,
      plannedEvents: 6,
      plannedParticipants: 80,
    }),
    item(GROUPS[8], "BTASP-8.3", "Monthly Progress Meetings", {
      interventionType: "Meetings / Online",
      participantType: "PMU, DFO, PIC, ISU",
      placeLevel: "Provincial level",
      daysPerEvent: 1,
      plannedEvents: 10,
      plannedParticipants: 100,
    }),
    item(GROUPS[8], "BTASP-8.4", "Annual Planning Meeting", {
      interventionType: "Meetings",
      participantType: "PMU, DFO, PIC, CF, ISU",
      placeLevel: "Provincial level",
      daysPerEvent: 1,
      plannedEvents: 1,
      plannedParticipants: 25,
    }),

    item(GROUPS[9], "BTASP-9.1", "Field monitoring and gadget use", {
      interventionType: "tbd.",
      participantType: "Forest Guards & VDC/WO",
      placeLevel: "Circle level",
      daysPerEvent: 2,
      plannedEvents: 3,
      plannedParticipants: 75,
    }),
    item(GROUPS[9], "BTASP-9.2", "1st Level MIS use and operations DFO", {
      interventionType: "tbd.",
      participantType: "DFO, SDFO",
      placeLevel: "Regional Level",
      daysPerEvent: 2,
      plannedEvents: 2,
      plannedParticipants: 20,
    }),
    item(GROUPS[9], "BTASP-9.3", "2nd Level MIS use and operations (PMU, CF, )", {
      interventionType: "tbd.",
      participantType: "PMU, CF",
      placeLevel: "Provincial Level",
      daysPerEvent: 2,
      plannedEvents: 2,
      plannedParticipants: 20,
    }),
    item(GROUPS[9], "BTASP-9.4", "3rd Level MIS use and operation (CCF + Secretertiat)", {
      interventionType: "tbd.",
      participantType: "CCF and higher Admin",
      placeLevel: "Provincial Level",
      daysPerEvent: 2,
      plannedEvents: 2,
      plannedParticipants: 20,
    }),
    item(GROUPS[9], "BTASP-9.5", "MIS Administration", {
      interventionType: "tbd.",
      participantType: "MIS Administrators",
      placeLevel: "Provincial Level",
      daysPerEvent: 2,
      plannedEvents: 2,
      plannedParticipants: 20,
    }),
  ];
}

export function isMalformedCapacityPlan(items = []) {
  if (!items.length) return true;
  const grouped = items.filter((i) => i.moduleGroupCode);
  const planned = items.reduce((s, i) => s + (Number(i.plannedEvents) || 0), 0);
  const headerAsItem = items.some(
    (i) => /capacity building/i.test(i.moduleCode || "") && !String(i.trainingSubject || "").trim()
  );
  return headerAsItem || grouped.length === 0 || planned === 0;
}
