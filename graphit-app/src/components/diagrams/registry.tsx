import React, { ComponentType, lazy } from 'react';
export const diagramRegistry: { [key: string]: React.LazyExoticComponent<ComponentType> } = {
  // igcse economics
  'supply-demand-graph': lazy(() => import('./tools/SupplyDemandGraph')),
  'production-possibility-curve': lazy(() => import('./tools/ProductionPossibilityCurve')),
  'market-failure-graph': lazy(() => import('./tools/MarketFailureGraph')),
  'cost-revenue-graph': lazy(() => import('./tools/CostRevenueGraph')),
  'externalities-graph': lazy(() => import('./tools/ExternalitiesGraph')),
  'price-controls-graph': lazy(() => import('./tools/PriceControlsGraph')),
  'tax-subsidy-graph': lazy(() => import('./tools/TaxSubsidyGraph')),
  'elasticity-graph': lazy(() => import('./tools/ElasticityGraph')),
  'break-even-graph': lazy(() => import('./tools/BreakEvenGraph')),
  // igcse geography
  'population-pyramid': lazy(() => import('./tools/PopulationPyramid')),
  'climate-graph': lazy(() => import('./tools/ClimateGraph')),
  'storm-hydrograph': lazy(() => import('./tools/StormHydrograph')),
  'demographic-transition-model': lazy(() => import('./tools/DemographicTransitionModel')),
  'river-profile-graph': lazy(() => import('./tools/RiverProfileGraph')),
  // igcse biology
  'dichotomous-key': lazy(() => import('./tools/DichotomousKey')),
  'punnett-square': lazy(() => import('./tools/PunnettSquare')),
  'ecology-diagrams': lazy(() => import('./tools/EcologyDiagrams')),
  'photosynthesis-graph': lazy(() => import('./tools/PhotosynthesisGraph')),
  'population-growth-graph': lazy(() => import('./tools/PopulationGrowthGraph')),
  'transpiration-graph': lazy(() => import('./tools/TranspirationGraph')),
  // igcse chemistry
  'gas-law-graph': lazy(() => import('./tools/GasLawGraph')),
  'titration-curve': lazy(() => import('./tools/TitrationCurve')),
  'reaction-rate-graph': lazy(() => import('./tools/ReactionRateGraph')),
  'energy-profile-diagram': lazy(() => import('./tools/EnergyProfileDiagram')),
  // igcse physics
  'motion-graph': lazy(() => import('./tools/MotionGraph')),
  'radioactive-decay-graph': lazy(() => import('./tools/RadioactiveDecayGraph')),
  'circuit-diagram': lazy(() => import('./tools/CircuitDiagram')),
  'doppler-effect-sound': lazy(() => import('./tools/DopplerEffectSound')),
  // igcse mathematics
  'function-graph': lazy(() => import('./tools/FunctionGraph')),
  'statistical-chart': lazy(() => import('./tools/StatisticalChart')),
  'histogram-tool': lazy(() => import('./tools/HistogramTool')),
  'box-plot-tool': lazy(() => import('./tools/BoxPlotTool')),
  'cumulative-frequency-tool': lazy(() => import('./tools/CumulativeFrequencyTool')),
  'transformation-graph': lazy(() => import('./tools/TransformationGraph')),
  'trigonometric-graph': lazy(() => import('./tools/TrigonometricGraph')),
  'exponential-log-graph': lazy(() => import('./tools/ExponentialLogGraph')),
  // a-level economics
  'ad-as-diagram': lazy(() => import('./tools/AdAsDiagram')),
  'phillips-curve-graph': lazy(() => import('./tools/PhillipsCurveGraph')),
  // a-level biology
  'enzyme-kinetics-graph': lazy(() => import('./tools/EnzymeKineticsGraph')),
  'oxygen-dissociation-curve': lazy(() => import('./tools/OxygenDissociationCurve')),
  'water-potential-calculator': lazy(() => import('./tools/WaterPotentialCalculator')),
  'microscopy-calculator': lazy(() => import('./tools/MicroscopyCalculator')),
  'enzyme-activity-graph': lazy(() => import('./tools/EnzymeActivityGraph')),
  // a-level chemistry
  'periodic-trends-graph': lazy(() => import('./tools/PeriodicTrendsGraph')),
  'kinetics-graph': lazy(() => import('./tools/KineticsGraph')),
  'spectroscopy-tool': lazy(() => import('./tools/SpectroscopyTool')),
  // a-level physics
  'projectile-motion-graph': lazy(() => import('./tools/ProjectileMotionGraph')),
  // a-level mathematics
  'numerical-integration-graph': lazy(() => import('./tools/NumericalIntegrationGraph')),
  'linear-regression-graph': lazy(() => import('./tools/LinearRegressionGraph')),
  // igcse physics (new)
  'iv-characteristics-graph': lazy(() => import('./tools/IVCharacteristicsGraph')),
  'heating-cooling-curve': lazy(() => import('./tools/HeatingCoolingCurve')),
  'wave-graph': lazy(() => import('./tools/WaveGraph')),
  // igcse chemistry (new)
  'solubility-curve': lazy(() => import('./tools/SolubilityCurve')),
  // a-level chemistry (new)
  'born-haber-cycle': lazy(() => import('./tools/BornHaberCycle')),
  'buffer-titration-graph': lazy(() => import('./tools/BufferTitrationGraph')),
};