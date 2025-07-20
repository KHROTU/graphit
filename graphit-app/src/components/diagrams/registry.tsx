import React, { ComponentType, lazy } from 'react';

export const diagramRegistry: { [key: string]: React.LazyExoticComponent<ComponentType> } = {
  // ig econ
  'supply-demand-graph': lazy(() => import('./tools/SupplyDemandGraph')),
  'production-possibility-curve': lazy(() => import('./tools/ProductionPossibilityCurve')),
  'market-failure-graph': lazy(() => import('./tools/MarketFailureGraph')),
  'cost-revenue-graph': lazy(() => import('./tools/CostRevenueGraph')),
  // ig geo
  'population-pyramid': lazy(() => import('./tools/PopulationPyramid')),
  'climate-graph': lazy(() => import('./tools/ClimateGraph')),
  // Iig bio
  'dichotomous-key': lazy(() => import('./tools/DichotomousKey')),
  'punnett-square': lazy(() => import('./tools/PunnettSquare')),
  'ecology-diagrams': lazy(() => import('./tools/EcologyDiagrams')),
  // ig chem
  'gas-law-graph': lazy(() => import('./tools/GasLawGraph')),
  'titration-curve': lazy(() => import('./tools/TitrationCurve')),
  'reaction-rate-graph': lazy(() => import('./tools/ReactionRateGraph')),
  'energy-profile-diagram': lazy(() => import('./tools/EnergyProfileDiagram')),
  // ig physics
  'motion-graph': lazy(() => import('./tools/MotionGraph')),
  'radioactive-decay-graph': lazy(() => import('./tools/RadioactiveDecayGraph')),
  'circuit-diagram': lazy(() => import('./tools/CircuitDiagram')),
  'doppler-effect-sound': lazy(() => import('./tools/DopplerEffectSound')),
  // ig maths
  'function-graph': lazy(() => import('./tools/FunctionGraph')),
  'statistical-chart': lazy(() => import('./tools/StatisticalChart')),
  // alevel
  'ad-as-diagram': lazy(() => import('./tools/SupplyDemandGraph')), // Placeholder
  'enzyme-activity-graph': lazy(() => import('./tools/EnergyProfileDiagram')), // Placeholder
  'decay-graph': lazy(() => import('./tools/RadioactiveDecayGraph')), // Placeholder
  // alevel econ
  // feeling cute might die later
  // alevel bio
  'enzyme-kinetics-graph': lazy(() => import('./tools/EnzymeKineticsGraph')),
  'oxygen-dissociation-curve': lazy(() => import('./tools/OxygenDissociationCurve')),
  'water-potential-calculator': lazy(() => import('./tools/WaterPotentialCalculator')),
  'microscopy-calculator': lazy(() => import('./tools/MicroscopyCalculator')),
  // alevel chem
  'periodic-trends-graph': lazy(() => import('./tools/PeriodicTrendsGraph')),
  'kinetics-graph': lazy(() => import('./tools/KineticsGraph')),
  'spectroscopy-tool': lazy(() => import('./tools/SpectroscopyTool')),
  // alevel physics
  'projectile-motion-graph': lazy(() => import('./tools/ProjectileMotionGraph')),
  // alevel maths
  'numerical-integration-graph': lazy(() => import('./tools/NumericalIntegrationGraph')),
  'linear-regression-graph': lazy(() => import('./tools/LinearRegressionGraph')),
};
