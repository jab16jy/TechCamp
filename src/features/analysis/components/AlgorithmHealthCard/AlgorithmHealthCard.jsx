const AlgorithmHealthCard = ({ precision = '94.2%', version = 'v4.2.0-stable', status = 'OPTIMO' }) => {
  return (
    <div className="ac-glass ac-glass--auto">
      <div className="ac-status-header" style={{ marginBottom: '1rem' }}>
        <span style={{ fontSize: '14px', fontWeight: '600' }}>Salud del Algoritmo</span>
        <span className="ac-status-badge" style={{ fontSize: '10px' }}>{status}</span>
      </div>
      <div className="ac-progress-bar">
        <div className="ac-progress-fill" style={{ width: precision }} />
      </div>
      <div className="ac-status-row" style={{ marginTop: '12px' }}>
        <span style={{ fontSize: '12px', color: '#707973' }}>Precision: {precision}</span>
        <span style={{ fontSize: '12px', color: '#707973', fontStyle: 'italic' }}>{version}</span>
      </div>
    </div>
  );
};

export default AlgorithmHealthCard;
